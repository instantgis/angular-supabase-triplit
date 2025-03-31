import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, Observable, distinctUntilChanged, map } from 'rxjs';
import { TriplitClient } from '@triplit/client';
import { createQuery } from '@triplit/angular';
import { schema } from '../../../triplit/schema';
import { environment } from '../../environments/environment';
import type { Entity } from '@triplit/client';

export type ConnectionStatus = 'OPEN' | 'CLOSED' | 'CONNECTING' | 'UNINITIALIZED';

export type Models = {
  todos: Entity<typeof schema, 'todos'>;
  projets: Entity<typeof schema, 'projets'>;
  pois: Entity<typeof schema, 'pois'>;
  medias: Entity<typeof schema, 'medias'>;
  thumbnails: Entity<typeof schema, 'thumbnails'>;
  extents: Entity<typeof schema, 'extents'>;
};

export type ProjectWithRelations = Models['projets'] & {
  pois: Models['pois'][] | null;
};

@Injectable({
  providedIn: 'root'
})
export class TriplitService {
  private client!: TriplitClient<typeof schema>;
  private connectionStatus = signal<ConnectionStatus>('UNINITIALIZED');
  readonly connectionStatus$ = toObservable(this.connectionStatus).pipe(
    distinctUntilChanged()
  );
  private localConnectionStatusCleanup?: () => void;

  private async handleSessionError(): Promise<void> {
    try {
      await this.endSession();
      window.dispatchEvent(new CustomEvent('triplit-session-error'));
    } catch (error) {
      console.error('TriplitService: Error handling session error:', error);
    }
  }

  getClient(): TriplitClient<typeof schema> {
    return this.client;
  }

  private async startSession(token: string): Promise<void> {
    await this.client.startSession(token);
  }

  endSession(): void {
    this.client.endSession();
  }

  async loginWithToken(token: string | null): Promise<void> {
    console.log('TriplitService: loginWithToken called', {
      hasToken: !!token,
      clientInitialized: !!this.client
    });
    
    try {
      if (token) {
        this.endSession();
        await this.startSession(token);
        console.log('TriplitService: New session started');
      } else {
        this.endSession();
        console.log('TriplitService: Session ended');
      }
    } catch (error) {
      console.error('TriplitService: Error in loginWithToken:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      this.endSession();
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.client.delete('projets', projectId);
    } catch (error) {
      console.error('TriplitService: Error deleting project:', error);
      throw error;
    }
  }

  getProjectsQueryForUser(userId?: string): Observable<Models['projets'][]> {
    // Note: Query callback will be triggered multiple times during sync transitions.
    // Use distinctUntilChanged() if you need to deduplicate results
    const query = this.client.query('projets')
      .Order('created_at', 'DESC');
    
    if (userId) {
      query.Where('owner_id', '=', userId);
    }

    return createQuery(() => ({ client: this.client, query })).results$ as Observable<Models['projets'][]>;
  }

  getProjectWithRelations(projectId: string): Observable<ProjectWithRelations | undefined> {
    const query = this.client.query('projets')
      .Where('id', '=', projectId)
      .Include('pois')
      .Include('thumbnail');

    return createQuery(() => ({ client: this.client, query })).results$.pipe(
      map(results => results?.[0])
    );
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$;
  }

  waitForConnection(): Observable<ConnectionStatus> {
    return this.connectionStatus$.pipe(
      filter(status => status === 'OPEN'),
      take(1)
    );
  }

  createLocalClient(): TriplitClient<typeof schema> {
    console.log('TriplitService: Creating local client (no remote sync)');
    
    const client = new TriplitClient<typeof schema>({
      storage: 'indexeddb',
      schema,
      logLevel: 'debug',
      serverUrl: undefined,  // No WebSocket connection attempted
      onSessionError: async (type) => {
        console.warn('TriplitService: Local client session error:', type);
        await this.handleSessionError();
      }
    });

    console.log('TriplitService: Initial client connection status:', client.connectionStatus);
    
    // Log ALL connection status changes
    client.onConnectionStatusChange((status) => {
      console.log('TriplitService: Local client connection status changed:', {
        from: client.connectionStatus,
        to: status
      });
      this.connectionStatus.set(status as ConnectionStatus);
    });

    this.client = client;
    return client;
  }

  createRemoteClient(token: string): TriplitClient<typeof schema> {
    console.log('TriplitService: Creating remote client');
    
    // Clean up local listener if it exists
    if (this.localConnectionStatusCleanup) {
      this.localConnectionStatusCleanup();
      this.localConnectionStatusCleanup = undefined;
    }

    const client = new TriplitClient<typeof schema>({
      storage: 'indexeddb',
      schema,
      logLevel: 'debug',
      serverUrl: environment.triplitServerUrl,
      token,
      onSessionError: async (type) => {
        console.warn('TriplitService: Remote client session error:', type);
        await this.handleSessionError();
      }
    });

    console.log('TriplitService: Initial remote client connection status:', client.connectionStatus);
    this.connectionStatus.set(client.connectionStatus as ConnectionStatus);
    
    // Log ALL connection status changes
    client.onConnectionStatusChange((status) => {
      console.log('TriplitService: Remote client connection status changed:', {
        from: client.connectionStatus,
        to: status,
        serverUrl: environment.triplitServerUrl,
        hasToken: !!token
      });
      this.connectionStatus.set(status as ConnectionStatus);
    });

    this.client = client;
    return client;
  }

  private setupClientListeners(client: TriplitClient<typeof schema>, prefix: 'Local' | 'Remote'): () => void {
    // Store all cleanup functions
    const cleanupFunctions = [
      // Connection status
      client.onConnectionStatusChange((status) => {
        console.log(`TriplitService: ${prefix} client connection status changed:`, {
          from: client.connectionStatus,
          to: status,
          serverUrl: prefix === 'Remote' ? environment.triplitServerUrl : undefined
        });
        this.connectionStatus.set(status as ConnectionStatus);
      }),

      // Sync errors
      client.onFailureToSyncWrites((e) => {
        console.error(`TriplitService: ${prefix} client failed to sync writes:`, { error: e });
      }),

      // WebSocket messages
      client.onSyncMessageSent((message) => {
        console.debug(`TriplitService: ${prefix} client sent message:`, message);
      }),

      client.onSyncMessageReceived((message) => {
        console.debug(`TriplitService: ${prefix} client received message:`, message);
      })
    ];

    // Return a composite cleanup function that calls all cleanup functions
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }

  async syncToRemote(userId: string): Promise<void> {
    console.log('TriplitService: Starting sync to remote', { userId });
    
    try {
      // Get only projects with null owner_id from local client
      const query = this.client.query('projets')
        .Where('owner_id', '=', null);

      // Use a one-time query instead of subscription
      const projects = await this.client.fetch(query);
      console.log('TriplitService: Found local projects without owner:', projects);
      
      // Update each project with the user ID
      for (const project of projects) {
        try {
          await this.client.update('projets', project.id, async (entity) => {
            entity.owner_id = userId;
          });
          console.log('TriplitService: Updated project:', project.id);
        } catch (error) {
          console.error('TriplitService: Error updating project:', project.id, error);
          // Continue with other projects even if one fails
        }
      }
      console.log('TriplitService: Updated local projects with owner_id:', userId);

    } catch (error) {
      console.error('TriplitService: Error in syncToRemote:', error);
      throw error;
    }
  }
}

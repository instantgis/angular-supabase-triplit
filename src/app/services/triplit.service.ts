import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, Observable, distinctUntilChanged, map, tap } from 'rxjs';
import { TriplitClient } from '@triplit/client';
import { createQuery } from '@triplit/angular';
import { schema } from '../../../triplit/schema';
import { environment } from '../../environments/.generated/environment';
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
  private connectionStatusCleanup?: () => void;
  constructor() {
    this.client = new TriplitClient<typeof schema>({
      storage: 'indexeddb',
      schema,
      logLevel: 'debug',
      serverUrl: environment.triplitServerUrl,
      autoConnect: false,
      onSessionError: async (type) => {
        console.warn('TriplitService: Remote client session error:', type);
        await this.handleSessionError();
      } 
    });

    this.connectionStatusCleanup = this.setupClientListeners(this.client);
  }

  ngOnDestroy() {
    this.connectionStatusCleanup?.();
  }

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

  async startAuthenticatedSession(token: string | null): Promise<void> {
    console.log('TriplitService: startAuthenticatedSession called', {
      hasToken: !!token,
      clientInitialized: !!this.client
    });
    
    if (!token) {
      throw new Error('Cannot start session without a token');
    }

    try {
      await this.startSession(token);
      console.log('TriplitService: New session started');
    } catch (error) {
      console.error('TriplitService: Error in startAuthenticatedSession:', {
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
    console.log('Getting projects:', {
      mode: this.client.serverUrl ? 'remote' : 'local'
    });
    
    const query = this.client.query('projets')
      .Order('created_at', 'DESC');
    
    if (this.client.serverUrl && userId) {
      query.Where('owner_id', '=', userId);
    }

    return createQuery(() => ({ client: this.client, query })).results$.pipe(
      map(results => results || []),
      tap(results => {
        console.log('Query results:', {
          count: results.length,
          mode: this.client.serverUrl ? 'remote' : 'local'
        });
      })
    ) as Observable<Models['projets'][]>;
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
  private setupClientListeners(client: TriplitClient<typeof schema>): () => void {
    const cleanupFunctions = [
      // Connection status
      client.onConnectionStatusChange((status) => {
        console.log('TriplitService: Connection status changed:', {
          from: client.connectionStatus,
          to: status,
          serverUrl: environment.triplitServerUrl
        });
        this.connectionStatus.set(status as ConnectionStatus);
      }),

      // Sync errors
      client.onFailureToSyncWrites((e) => {
        console.error('TriplitService: Failed to sync writes:', { error: e });
      }),

      // WebSocket messages
      client.onSyncMessageSent((message) => {
        console.debug('TriplitService: Message sent:', message);
      }),

      client.onSyncMessageReceived((message) => {
        console.debug('TriplitService: Message received:', message);
      })
    ];

    return () => cleanupFunctions.forEach(cleanup => cleanup());
  }

  async syncToRemote(userId: string): Promise<void> {
    console.log('Starting sync to remote');
    
    try {
      const query = this.client.query('projets')
        .Where('owner_id', '=', null);

      const projects = await this.client.fetch(query);
      console.log('Found local projects to sync:', projects.length);
      
      for (const project of projects) {
        try {
          await this.client.update('projets', project.id, async (entity) => {
            entity.owner_id = userId;
          });
          console.log('Updated project:', { id: project.id });
        } catch (error) {
          console.error('Error updating project:', { id: project.id });
        }
      }
      console.log('Sync complete');

    } catch (error) {
      console.error('Error in sync:', error);
      throw error;
    }
  }
}

import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, Observable, distinctUntilChanged, map, tap } from 'rxjs';
import { TriplitClient } from '@triplit/client';
import { createQuery } from '@triplit/angular';
import { schema } from '../../../triplit/schema';
import { environment } from '../../environments/.generated/environment';
import type { Entity } from '@triplit/client';

export type ConnectionStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'CONNECTING'
  | 'UNINITIALIZED';

export type Models = {
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
  providedIn: 'root',
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
      },
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
      clientInitialized: !!this.client,
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
        error,
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

  // Make this private since it's now an implementation detail
  getProjectsQueryForUser() {
    const query = this.client.query('projets')
      .Order('created_at', 'DESC');
    
    return createQuery(() => ({ client: this.client, query }));
  }

  getProjectWithRelations(
    projectId: string
  ): Observable<ProjectWithRelations | undefined> {
    const query = this.client
      .query('projets')
      .Where('id', '=', projectId)
      .Include('pois')
      .Include('thumbnail');

    return createQuery(() => ({ client: this.client, query })).results$.pipe(
      map((results) => results?.[0])
    );
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$;
  }

  waitForConnection(): Observable<ConnectionStatus> {
    return this.connectionStatus$.pipe(
      filter((status) => status === 'OPEN'),
      take(1)
    );
  }
  private setupClientListeners(
    client: TriplitClient<typeof schema>
  ): () => void {
    const cleanupFunctions = [
      // Connection status
      client.onConnectionStatusChange((status) => {
        console.log('TriplitService: Connection status changed:', {
          from: client.connectionStatus,
          to: status,
          serverUrl: environment.triplitServerUrl,
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
      }),
    ];

    return () => cleanupFunctions.forEach((cleanup) => cleanup());
  }

  async claimLocalProjets(userId: string) {
    const query = this.client
      .query('projets')
      .Where('owner_id', '=', null)
      .Select(['id', 'owner_id']);
    const projects = await this.client.fetch(query);
    console.log('Found local projects to claim:', projects.length);

    for (const project of projects) {
      try {
        await this.client.update('projets', project.id, (entity) => {
          entity.owner_id = userId;
        });
        console.log('Claimed project:', { id: project.id });
      } catch (error) {
        console.error('Error claiming project:', { id: project.id, error });
      }
    }
  }

  async claimLocalPois(userId: string) {
    const query = this.client
      .query('pois')
      .Where('owner_id', '=', null)
      .Select(['id', 'owner_id']);
    const pois = await this.client.fetch(query);
    console.log('Found local POIs to claim:', pois.length);

    for (const poi of pois) {
      try {
        await this.client.update('pois', poi.id, (entity) => {
          entity.owner_id = userId;
        });
        console.log('Claimed POI:', { id: poi.id });
      } catch (error) {
        console.error('Error claiming POI:', { id: poi.id, error });
      }
    }
  }

  async claimLocalMedias(userId: string) {
    const query = this.client
      .query('medias')
      .Where('owner_id', '=', null)
      .Select(['id', 'owner_id']);
    const medias = await this.client.fetch(query);
    console.log('Found local medias to claim:', medias.length);

    for (const media of medias) {
      try {
        await this.client.update('medias', media.id, (entity) => {
          entity.owner_id = userId;
        });
        console.log('Claimed media:', { id: media.id });
      } catch (error) {
        console.error('Error claiming media:', { id: media.id, error });
      }
    }
  }

  async claimLocalThumbnails(userId: string) {
    const query = this.client
      .query('thumbnails')
      .Where('owner_id', '=', null)
      .Select(['id', 'owner_id']);
    const thumbnails = await this.client.fetch(query);
    console.log('Found local thumbnails to claim:', thumbnails.length);

    for (const thumbnail of thumbnails) {
      try {
        await this.client.update('thumbnails', thumbnail.id, (entity) => {
          entity.owner_id = userId;
        });
        console.log('Claimed thumbnail:', { id: thumbnail.id });
      } catch (error) {
        console.error('Error claiming thumbnail:', { id: thumbnail.id, error });
      }
    }
  }

  async claimLocalExtents(userId: string) {
    const query = this.client
      .query('extents')
      .Where('owner_id', '=', null)
      .Select(['id', 'owner_id']);
    const extents = await this.client.fetch(query);
    console.log('Found local extents to claim:', extents.length);

    for (const extent of extents) {
      try {
        await this.client.update('extents', extent.id, (entity) => {
          entity.owner_id = userId;
        });
        console.log('Claimed extent:', { id: extent.id });
      } catch (error) {
        console.error('Error claiming extent:', { id: extent.id, error });
      }
    }
  }

  async claimAllLocalCollections(userId: string): Promise<void> {
    await this.claimLocalProjets(userId);
    await this.claimLocalPois(userId);
    await this.claimLocalMedias(userId);
    await this.claimLocalThumbnails(userId);
    await this.claimLocalExtents(userId);
  }
}

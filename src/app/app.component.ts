import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ConnectionStatusComponent } from './connection-status/connection-status.component';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './auth/profile/profile.component';
import { CreateProjectComponent } from './project/create-project/create-project.component';
import { TriplitService } from './services/triplit.service';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import type { Models } from './services/triplit.service';
import { SupabaseService } from './services/supabase.service';
import { ProjectCardComponent } from './project/project-card/project-card.component';
import { take } from 'rxjs/operators';
import { User } from '@supabase/supabase-js';

/**
 * Root component handling:
 * - Authentication state management
 * - Local/Remote data sync
 * - Project list display
 * 
 * @remarks
 * This component initializes in local-only mode and can transition
 * to remote mode when user chooses to sync.
 * 
 * @example
 * ```typescript
 * // Initialize local client
 * const client = this.triplitService.createLocalClient();
 * 
 * // Later, sync to remote
 * await this.syncLocalProjects();
 * ```
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ConnectionStatusComponent,
    CommonModule,
    ProfileComponent,
    CreateProjectComponent,
    ProjectCardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  queryResults!: Observable<Models['projets'][]>;
  private currentSubscription?: Subscription;

  readonly triplitService = inject(TriplitService);
  readonly supabaseService = inject(SupabaseService);

  constructor() {}

  ngOnInit() {
    // Initially get all projects without userId filter
    this.queryResults = this.triplitService.getProjectsQueryForUser();
    this.currentSubscription = this.queryResults.subscribe(projects => {
      console.log('AppComponent: Projects loaded:', projects);
    });
  }

  async syncLocalProjects() {
    const user = await firstValueFrom(this.supabaseService.user$.pipe(take(1)));
    if (!user) return;
    
    await this.syncToRemote(user);
    
    const { data: { session } } = await this.supabaseService.getSession();
    const token = session?.access_token ?? '';
    
    await this.triplitService.loginWithToken(token);
    
    await firstValueFrom(this.triplitService.waitForConnection().pipe(take(1)));
    console.log('AppComponent: Connected to remote');

    // After connecting to remote, update query with user ID
    this.queryResults = this.triplitService.getProjectsQueryForUser(user.id);
    this.currentSubscription?.unsubscribe();
    this.currentSubscription = this.queryResults.subscribe(projects => {
      console.log('AppComponent: Remote projects loaded:', projects);
    });
  }

  async syncToRemote(user: User) {
    console.log('AppComponent: Starting sync to remote...');
    await this.triplitService.syncToRemote(user.id);
    
    const { data: { session } } = await this.supabaseService.getSession();
    const token = session?.access_token ?? '';
    
    await this.triplitService.loginWithToken(token);
    
    await firstValueFrom(this.triplitService.waitForConnection().pipe(take(1)));
    console.log('AppComponent: Connected to remote');
  }

  ngOnDestroy() {
    this.currentSubscription?.unsubscribe();
  }
}

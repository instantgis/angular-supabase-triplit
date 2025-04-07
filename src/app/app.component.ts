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
import { take, map, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
export class AppComponent {
  readonly triplitService = inject(TriplitService);
  readonly supabaseService = inject(SupabaseService);

  readonly queryResults = this.triplitService.getProjectsQueryForUser();
}

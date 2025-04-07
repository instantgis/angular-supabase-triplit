import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TriplitService } from '../services/triplit.service';
import { SupabaseService } from '../services/supabase.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent {
  private triplitService = inject(TriplitService);
  private supabaseService = inject(SupabaseService);
  
  status$ = this.triplitService.getConnectionStatus();
  isSignedIn$ = this.supabaseService.user$.pipe(
    map(user => !!user)
  );

  async startRemoteSync() {
    console.log('Starting remote sync process...');
    try {
      const { data: { session } } = await this.supabaseService.getSession();
      if (session?.access_token) {
        console.log('Session found, starting sync for user:', session.user.id);
        await this.triplitService.claimAllLocalCollections(session.user.id);
        console.log('Local collections claimed, starting authenticated session...');
        await this.triplitService.startAuthenticatedSession(session.access_token);
        console.log('Remote sync process completed successfully');
      } else {
        console.warn('No active session found, sync aborted');
      }
    } catch (error) {
      console.error('Error during remote sync:', error);
      throw error;
    }
  }
}








import { Component } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  showLoginForm = false;

  constructor(public supabaseService: SupabaseService) {
    // Add debug logging
    this.supabaseService.user$.subscribe(user => {
      console.log('Current user state:', user);
    });
  }

  async signOut() {
    await this.supabaseService.signOut();
  }
}


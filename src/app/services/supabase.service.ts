import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { TriplitService } from './triplit.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private triplitService: TriplitService) {
    // Validate URLs before initialization
    if (!environment.supabaseUrl || !environment.supabaseUrl.startsWith('https://')) {
      console.error('Invalid Supabase URL:', environment.supabaseUrl);
      throw new Error('Invalid Supabase URL configuration');
    }

    if (!environment.supabaseKey) {
      throw new Error('Missing Supabase key configuration');
    }

    // Ensure URL ends with no trailing slash
    const supabaseUrl = environment.supabaseUrl.replace(/\/$/, '');

    this.supabase = createClient(
      supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true
        }
      }
    );

    // Let's handle initial auth state only through getSession()
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        this.userSubject.next(session.user);
      }
    });

    // Handle both sign-in and sign-out events
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth event:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        this.userSubject.next(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.userSubject.next(null);
        this.triplitService.endSession();
      }
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    console.log('Attempting sign in...');
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    console.log('Sign in successful');
    this.userSubject.next(data.user);
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }
}












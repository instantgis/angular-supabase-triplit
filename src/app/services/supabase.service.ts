import { Injectable, OnDestroy, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/.generated/environment';
import { BehaviorSubject } from 'rxjs';
import { TriplitService } from './triplit.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService implements OnDestroy {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private authStateCleanup?: () => void;
  private readonly triplitService = inject(TriplitService);

  constructor() {
    if (!environment.supabaseUrl || !environment.supabaseUrl.startsWith('https://')) {
      console.error('Invalid Supabase URL:', environment.supabaseUrl);
      throw new Error('Invalid Supabase URL configuration');
    }

    if (!environment.supabaseKey) {
      throw new Error('Missing Supabase key configuration');
    }

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

    this.setupAuthSubscription();
  }

  private setupAuthSubscription() {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, session });
        
        switch (event) {
          case 'INITIAL_SESSION':
            break;
          case 'SIGNED_IN':
            this.userSubject.next(session?.user ?? null);
            break;
            
          case 'SIGNED_OUT':
            this.userSubject.next(null);
            break;
            
          case 'TOKEN_REFRESHED':
            await this.triplitService.endSession();
            await this.triplitService.startAuthenticatedSession(session?.access_token ?? null);
            break;
        }
      }
    );

    this.authStateCleanup = () => subscription.unsubscribe();
  }

  ngOnDestroy() {
    this.authStateCleanup?.();
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
    try {
      // First, get the current user
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        // No user logged in, just clean up
        console.log('No user found, cleaning up local state');
        this.userSubject.next(null);
        this.triplitService.endSession();
        return;
      }

      try {
        // Try to sign out from Supabase
        await this.supabase.auth.signOut();
      } catch (error) {
        // Ignore specific JWT session errors
        if (error instanceof Error && error.message.includes('Session from session_id claim in JWT does not exist')) {
          console.log('Session already expired, proceeding with local cleanup');
        } else {
          console.error('Unexpected sign out error:', error);
        }
      }

      // Always clean up local state
      this.userSubject.next(null);
      this.triplitService.endSession();
      
      // Force clear any lingering auth state
      await this.supabase.auth.initialize();
      
    } catch (error) {
      console.error('Sign out process error:', error);
      // Ensure local state is cleaned up even on errors
      this.userSubject.next(null);
      this.triplitService.endSession();
    }
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }
}












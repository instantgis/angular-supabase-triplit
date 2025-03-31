import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  authForm: FormGroup;
  isLogin = true;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (!this.authForm.valid) return;

    try {
      const { email, password } = this.authForm.value;
      
      if (this.isLogin) {
        await this.supabaseService.signIn(email, password);
      } else {
        await this.supabaseService.signUp(email, password);
      }
      
      this.error = null;
      this.loginSuccess.emit();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'An unknown error occurred';
    }
  }
}


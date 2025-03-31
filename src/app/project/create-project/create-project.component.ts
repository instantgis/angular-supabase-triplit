import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TriplitService } from '../../services/triplit.service';
import { SupabaseService } from '../../services/supabase.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.scss']
})
export class CreateProjectComponent {
  projectForm: FormGroup;
  error: string | null = null;
  defaultValues: { [key: string]: any };

  constructor(
    private fb: FormBuilder,
    private triplitService: TriplitService,
    private supabaseService: SupabaseService
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required]],
      content: ['Test description'],
      language: ['en', [Validators.required]],
      transport: ['walking', [Validators.required]],
      status: ['draft', [Validators.required]],
      duration: [1.5],
    });

    // Reset form to these defaults after successful submission
    this.defaultValues = {
      name: '',
      content: 'Test description',
      language: 'en',
      transport: 'walking',
      status: 'draft',
      duration: 1.5
    };
  }

  async onSubmit() {
    if (!this.projectForm.valid) return;

    try {
      const client = this.triplitService.getClient();
      
      const projectData = {
        ...this.projectForm.value,
        edited_at: new Date(),
      };

      // Only add owner_id if user exists
      const user = await this.supabaseService.user$.pipe(take(1)).toPromise();
      if (user) {
        projectData.owner_id = user.id;
      }

      await client.insert('projets', projectData);
      
      // Reset to our defaults instead of empty values
      this.projectForm.reset(this.defaultValues);
      this.error = null;
      
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to create project';
      console.error('Error creating project:', error);
    }
  }
}



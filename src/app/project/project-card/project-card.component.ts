import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Models } from '../../services/triplit.service';
import { TriplitService } from '../../services/triplit.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss']
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Models['projets'];
  error: string | null = null;

  constructor(private triplitService: TriplitService) {}

  async deleteProject() {
    try {
      await this.triplitService.deleteProject(this.project.id);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to delete project';
      console.error('Error deleting project:', error);
    }
  }
}
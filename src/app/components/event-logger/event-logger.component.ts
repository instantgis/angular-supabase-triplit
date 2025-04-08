import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventLoggerService } from '../../services/event-logger.service';

@Component({
  selector: 'app-event-logger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-logger.component.html',
  styleUrls: ['./event-logger.component.scss']
})
export class EventLoggerComponent {
  protected logger = inject(EventLoggerService);
  isOpen = false;

  toggleLogger() {
    this.isOpen = !this.isOpen;
  }

  clearLogs() {
    this.logger.clear();
  }
}

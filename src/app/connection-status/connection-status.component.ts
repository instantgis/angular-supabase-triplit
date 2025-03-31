import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TriplitService } from '../services/triplit.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent {
  status$;

  constructor(triplitService: TriplitService) {
    this.status$ = triplitService.getConnectionStatus();
  }
}





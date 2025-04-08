import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LogEntry {
  timestamp: Date;
  category: 'AUTH' | 'TRIPLIT' | 'APP' | 'ERROR';
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventLoggerService {
  private logs = new BehaviorSubject<LogEntry[]>([]);
  logs$ = this.logs.asObservable();
  private readonly MAX_LOGS = 1000;
  private originalConsole: typeof console;

  constructor() {
    this.originalConsole = { ...console };
    this.interceptConsole();
  }

  private interceptConsole() {
    console.log = (...args) => {
      this.originalConsole.log(...args);
      // Filter out CSS style arguments
      const cleanArgs = args.filter(arg => typeof arg !== 'string' || !arg.startsWith('color:'));
      this.log('APP', cleanArgs[0], cleanArgs.slice(1));
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      const cleanArgs = args.filter(arg => typeof arg !== 'string' || !arg.startsWith('color:'));
      this.log('ERROR', cleanArgs[0], cleanArgs.slice(1));
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      const cleanArgs = args.filter(arg => typeof arg !== 'string' || !arg.startsWith('color:'));
      this.log('APP', `⚠️ ${cleanArgs[0]}`, cleanArgs.slice(1));
    };

    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      const cleanArgs = args.filter(arg => typeof arg !== 'string' || !arg.startsWith('color:'));
      this.log('APP', cleanArgs[0], cleanArgs.slice(1));
    };
  }

  log(category: LogEntry['category'], message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      category,
      message: this.formatMessage(message),
      details: details ? this.sanitizeDetails(details) : undefined
    };
    
    const currentLogs = this.logs.getValue();
    this.logs.next([entry, ...currentLogs].slice(0, this.MAX_LOGS));
  }

  private formatMessage(message: any): string {
    if (typeof message === 'string') {
      // Strip out CSS formatting directives
      return message.replace(/%c/g, '').replace(/\s+/g, ' ').trim();
    }
    if (message instanceof Error) return message.message;
    return JSON.stringify(message);
  }

  clear() {
    this.logs.next([]);
  }

  private sanitizeDetails(details: any): any {
    return JSON.parse(JSON.stringify(details, (key, value) => {
      if (key === 'password' || key === 'access_token' || key === 'refresh_token') {
        return '[REDACTED]';
      }
      return value;
    }));
  }
}


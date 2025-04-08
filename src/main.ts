import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { inject, ErrorHandler } from '@angular/core';
import { EventLoggerService } from './app/services/event-logger.service';

class GlobalErrorHandler extends ErrorHandler {
  private logger = inject(EventLoggerService);

  override handleError(error: Error) {
    this.logger.log('ERROR', 'Unhandled error:', error);
    super.handleError(error);
  }
}

// Initialize the logger before the app starts
const initLogger = () => {
  const logger = inject(EventLoggerService);
  return () => {};
};

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: 'LOGGER_INIT', useFactory: initLogger, deps: [EventLoggerService] }
  ]
}).catch((err) => console.error(err));




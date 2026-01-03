import { Injectable, Logger } from '@nestjs/common';

export type LogContext = {
  module?: string;
  action?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
};

@Injectable()
export class AppLogger {
  private readonly logger = new Logger('App');

  info(message: string, context?: LogContext) {
    this.logger.log(this.format(message, context));
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(this.format(message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    this.logger.error(
      this.format(message, context),
      error instanceof Error ? error.stack : undefined,
    );
  }

  private format(message: string, context?: LogContext) {
    return JSON.stringify({
      message,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }
}

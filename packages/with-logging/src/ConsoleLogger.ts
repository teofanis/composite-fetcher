/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import type { Logger } from '@/interfaces';

export class ConsoleLogger implements Logger {
  debug(message: string, ...optionalParams: any[]): void {
    console.debug(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: any[]): void {
    console.info(message, ...optionalParams);
  }

  notice(message: string, ...optionalParams: any[]): void {
    console.log('[NOTICE]', message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    console.warn(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }

  critical(message: string, ...optionalParams: any[]): void {
    console.error('[CRITICAL]', message, ...optionalParams);
  }

  alert(message: string, ...optionalParams: any[]): void {
    console.error('[ALERT]', message, ...optionalParams);
  }

  emergency(message: string, ...optionalParams: any[]): void {
    console.error('[EMERGENCY]', message, ...optionalParams);
  }
}

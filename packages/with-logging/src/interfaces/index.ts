/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Logger {
  debug(message: string, ...optionalParams: any[]): void;
  info(message: string, ...optionalParams: any[]): void;
  notice(message: string, ...optionalParams: any[]): void;
  warn(message: string, ...optionalParams: any[]): void;
  error(message: string, ...optionalParams: any[]): void;
  critical(message: string, ...optionalParams: any[]): void;
  alert(message: string, ...optionalParams: any[]): void;
  emergency(message: string, ...optionalParams: any[]): void;
}
export interface withLoggingOptions {
  logger?: Logger;
}

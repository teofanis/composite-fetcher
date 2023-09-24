import { ConsoleLogger } from '@/ConsoleLogger';
import type { Logger } from '@/interfaces';

describe('ConsoleLogger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Mock console methods
    console.debug = jest.fn();
    console.info = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    logger = new ConsoleLogger();
  });

  it('logs debug messages correctly', () => {
    logger.debug('debug message', { test: true });
    expect(console.debug).toHaveBeenCalledWith('debug message', { test: true });
  });

  it('logs info messages correctly', () => {
    logger.info('info message', { test: true });
    expect(console.info).toHaveBeenCalledWith('info message', { test: true });
  });

  it('logs notice messages correctly', () => {
    logger.notice('notice message', { test: true });
    expect(console.log).toHaveBeenCalledWith('[NOTICE]', 'notice message', {
      test: true,
    });
  });

  it('logs warn messages correctly', () => {
    logger.warn('warn message', { test: true });
    expect(console.warn).toHaveBeenCalledWith('warn message', { test: true });
  });

  it('logs error messages correctly', () => {
    logger.error('error message', { test: true });
    expect(console.error).toHaveBeenCalledWith('error message', { test: true });
  });

  it('logs critical messages correctly', () => {
    logger.critical('critical message', { test: true });
    expect(console.error).toHaveBeenCalledWith(
      '[CRITICAL]',
      'critical message',
      { test: true },
    );
  });

  it('logs alert messages correctly', () => {
    logger.alert('alert message', { test: true });
    expect(console.error).toHaveBeenCalledWith('[ALERT]', 'alert message', {
      test: true,
    });
  });

  it('logs emergency messages correctly', () => {
    logger.emergency('emergency message', { test: true });
    expect(console.error).toHaveBeenCalledWith(
      '[EMERGENCY]',
      'emergency message',
      { test: true },
    );
  });
});

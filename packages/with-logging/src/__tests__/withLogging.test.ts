/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import { ConsoleLogger } from '@/ConsoleLogger';
import type { Logger } from '@/interfaces';
import withLoggingPlugin from '@/withLogging';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = jest.fn(() =>
  Promise.resolve(new Response('test response', { status: 200 })),
);

describe('withLoggingPlugin', () => {
  let mockLogger: Logger;
  let plugin: withLoggingPlugin;

  beforeEach(() => {
    // Mock logger to capture the logs without really logging them
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      notice: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      critical: jest.fn(),
      alert: jest.fn(),
      emergency: jest.fn(),
    };

    plugin = new withLoggingPlugin(mockLogger);
  });

  it('logs incoming requests correctly', async () => {
    const mockRequestContext = {
      request: {
        url: 'https://test.com/api',
        method: 'GET',
        headers: {
          entries: jest.fn().mockReturnValue([]),
        },
      },
      next: jest.fn(),
    };

    await plugin.onPreRequest(mockRequestContext as any);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Incoming request to: https://test.com/api',
      {
        method: 'GET',
        headers: {},
      },
    );
    expect(mockRequestContext.next).toHaveBeenCalled();
  });

  it('logs received responses correctly', async () => {
    const mockResponseContext = {
      response: {
        status: 200,
        statusText: 'OK',
        headers: {
          entries: jest.fn().mockReturnValue([['Content-Type', 'text/plain']]),
        },
      },
      originalRequest: {
        url: 'https://test.com/api',
      },
      next: jest.fn(),
    };

    await plugin.onPostRequest(mockResponseContext as any);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received response from: https://test.com/api',
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/plain',
        },
      },
    );
    expect(mockResponseContext.next).toHaveBeenCalled();
  });

  it('uses ConsoleLogger by default if no logger is provided', () => {
    const defaultPlugin = new withLoggingPlugin();
    // @ts-expect-error - private property
    expect(defaultPlugin.logger).toBeInstanceOf(ConsoleLogger);
  });
});

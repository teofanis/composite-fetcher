/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable new-cap */
import withRetriesPlugin from '@/withRetries';
import { Fetcher } from '@composite-fetcher/core';
import _fetchMock from 'isomorphic-fetch';

describe('withRetriesPlugin', () => {
  let plugin: withRetriesPlugin;

  beforeEach(() => {
    plugin = new withRetriesPlugin(3);
  });

  it('should retry the operation the specified number of times on failure', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    // @ts-expect-error - private method
    await plugin.retryOperation(mockFn, onSuccess, onFailure, 0, 3);

    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('should not retry the operation if it succeeds', async () => {
    const mockFn = jest.fn().mockResolvedValue('Success');
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    // @ts-expect-error - private method
    await plugin.retryOperation(mockFn, onSuccess, onFailure, 0, 3);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('Success');
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('should not retry the request if response is OK', async () => {
    const mockContext = {
      response: { ok: true },
      originalRequest: {
        headers: new Map(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await plugin.onPostRequest(mockContext as any);

    expect(result).toBeUndefined();
  });

  it('should not retry the request if x-fetcher-no-retry header is present', async () => {
    const mockContext = {
      response: { ok: false },
      originalRequest: {
        headers: new Map([['x-fetcher-no-retry', 'true']]),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await plugin.onPostRequest(mockContext as any);

    expect(result).toBeUndefined();
  });

  it('should retry the operation based on x-fetcher-retry-times header', async () => {
    // Mock the fetch function
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed 1'))
      .mockRejectedValueOnce(new Error('Failed 2'))
      .mockResolvedValue('Success on third attempt');

    const mockContext = {
      response: { ok: false },
      originalRequest: {
        headers: new Map([['x-fetcher-retry-times', '3']]),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await plugin.onPostRequest(mockContext as any);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual('Success on third attempt');
  });

  it('should succeed after retrying', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed 1'))
      .mockResolvedValue('Success on second attempt');
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    // @ts-expect-error - private method
    await plugin.retryOperation(mockFn, onSuccess, onFailure, 0, 3);

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledWith('Success on second attempt');
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('should not retry if x-fetcher-retry-times header is set to 0', async () => {
    // Mock the fetch function to always fail
    global.fetch = jest.fn().mockRejectedValue(new Error('Failed'));

    const mockContext = {
      response: { ok: false },
      originalRequest: {
        headers: new Map([['x-fetcher-retry-times', '0']]),
      },
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await plugin.onPostRequest(mockContext as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Catch the error thrown by the plugin after all retries
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Failed');
    }

    // Ensure fetch was called only once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

type FetchMock = typeof import('fetch-mock');
const fetchMock = _fetchMock as unknown as FetchMock;

describe('Integration Tests: withRetriesPlugin', () => {
  let fetcher: Fetcher;

  beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
    global.Request = fetchMock.config.Request as unknown as typeof Request;
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    global.Headers = fetchMock.config.Headers as unknown as typeof Headers;
    fetcher = new Fetcher();
    const retriesPlugin = new withRetriesPlugin(3);
    fetcher.use(retriesPlugin);
  });

  it('should retry the request the specified number of times on failure', async () => {
    fetchMock.get('https://example.com', 400, {
      overwriteRoutes: true,
    });
    try {
      await fetcher.fetch('https://example.com');
    } catch (error: any) {
      expect(error.message).toBe('Failed');
    }

    expect(fetchMock.calls('https://example.com').length).toBe(3);
  });

  it('should not retry the request if response is OK', async () => {
    fetchMock.get('https://example.com', 200, {
      overwriteRoutes: true,
    });

    await fetcher.fetch('https://example.com');

    expect(fetchMock.calls('https://example.com').length).toBe(1);
  });

  it('should not retry the request if x-fetcher-no-retry header is present', async () => {
    fetchMock.get(
      'https://example.com',
      { throws: new Error('Failed') },
      {
        overwriteRoutes: true,
      },
    );

    try {
      await fetcher.fetch('https://example.com', {
        headers: { 'x-fetcher-no-retry': 'true' },
      });
    } catch (error: any) {
      expect(error.message).toBe('Failed');
    }

    expect(fetchMock.calls('https://example.com').length).toBe(1);
  });

  it('should retry the operation based on x-fetcher-retry-times header', async () => {
    fetchMock
      .getOnce(
        'https://example.com',
        { throws: new Error('Failed 1') },
        { overwriteRoutes: true },
      )
      .getOnce(
        'https://example.com',
        { throws: new Error('Failed 2') },
        { overwriteRoutes: true },
      )
      .getOnce('https://example.com', 200, { overwriteRoutes: true });

    await fetcher.fetch('https://example.com', {
      headers: { 'x-fetcher-retry-times': '3' },
    });

    expect(fetchMock.calls('https://example.com').length).toBe(3);
  });
});

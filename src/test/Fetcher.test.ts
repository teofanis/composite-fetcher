import { Fetcher } from '@/lib/Fetcher.js';
import { Mock, beforeEach, describe, expect, test, vi } from 'vitest';
import { Response } from 'cross-fetch';
import { BasePlugin } from '@/lib/plugins';

const mockFetch = vi.fn();

(global as any).fetch = mockFetch;

const mockResponseData = {
  message: 'Hello, world!',
};

class MockedResponse extends Response {
  constructor(body: BodyInit, init?: ResponseInit) {
    super(body, init);
  }
}

function createFetchResponse(body: object, init?: ResponseInit) {
  return new MockedResponse(JSON.stringify(body), init);
}

class TestBeforePlugin extends BasePlugin {
  async beforeRequest(url: string, options: RequestInit) {
    return { headers: { Authorization: 'Bearer token' } };
  }
}

class TestAfterPlugin extends BasePlugin {
  async afterResponse(response: Response) {
    return Promise.resolve(
      createFetchResponse({
        message: 'Hello, world!',
        modified: true,
      })
    );
  }
}

class TestBothPlugins extends BasePlugin {
  async beforeRequest(url: string, options: RequestInit) {
    expect(url).toBe('https://example.com/data');
    expect(options).toStrictEqual({});
    return { headers: { Authorization: 'Bearer token' } };
  }

  async afterResponse(response: Response) {
    return Promise.resolve(
      createFetchResponse({
        message: 'Hello, world!',
        modified: true,
      })
    );
  }
}

describe('Fetcher', () => {
  describe('core', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    test('fetch data without plugins', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);

      const result = await fetcher.fetch('/data');
      expect(await result.json()).toEqual(mockResponseData);
    });

    test('fetch data with TestBeforePlugin', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      fetcher.use(new TestBeforePlugin());

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      expect(await result.json()).toEqual(mockResponseData);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: { Authorization: 'Bearer token' },
      });
    });

    test('fetch data with TestAfterPlugin', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      fetcher.use(new TestAfterPlugin());

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      const modifiedResponseData = await result.json();
      expect(modifiedResponseData).toEqual({
        message: 'Hello, world!',
        modified: true,
      });
    });

    test('fetch data with multiple plugins', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      fetcher.use([new TestBeforePlugin(), new TestAfterPlugin()]);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: { Authorization: 'Bearer token' },
      });
      expect(await result.json()).toEqual({
        message: 'Hello, world!',
        modified: true,
      });
    });

    test('fetch data with TestBothPlugins', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      fetcher.use(new TestBothPlugins());

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      const modifiedResponseData = await result.json();
      expect(modifiedResponseData).toEqual({
        message: 'Hello, world!',
        modified: true,
      });
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: { Authorization: 'Bearer token' },
      });
    });
  });
});

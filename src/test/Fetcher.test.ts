import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createFetchResponse,
  createTestAfterPlugin,
  createTestBeforePlugin,
} from '@/test/testUtils';

import { Fetcher } from '@/lib/Fetcher.js';

const mockFetch = vi.fn();

(global as any).fetch = mockFetch;

const mockResponseData = {
  message: 'Hello, world!',
};

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

    test('fetch data with before plugin', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const testPlugin = createTestBeforePlugin();
      fetcher.use(testPlugin);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      expect(await result.json()).toEqual(mockResponseData);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: { Authorization: 'Bearer token' },
      });
    });

    test('fetch data with after plugin', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const testPlugin = createTestAfterPlugin({
        mergeOptions: {
          response: false,
        },
      });
      fetcher.use(testPlugin);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      const modifiedResponseData = await result.json();
      expect(modifiedResponseData).toEqual({
        modified: true,
      });
    });

    test('fetch data with multiple plugins', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const beforePlugin = createTestBeforePlugin();
      const afterPlugin = createTestAfterPlugin();
      fetcher.use([beforePlugin, afterPlugin]);

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

    test('fetch data with multiple plugins and merge options', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const beforePlugin = createTestBeforePlugin();
      const afterPlugin = createTestAfterPlugin();
      fetcher.use([beforePlugin, afterPlugin]);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const postData = {
        test: 'test',
        params: {
          testOne: 'testOne',
        },
      };
      const result = await fetcher.fetch('/data', {
        headers: {
          'X-test': 'test',
        },
        method: 'POST',
        body: JSON.stringify(postData),
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: { Authorization: 'Bearer token', 'X-test': 'test' },
        method: 'POST',
        body: JSON.stringify(postData),
      });
      expect(await result.json()).toEqual({
        message: 'Hello, world!',
        modified: true,
      });
    });

    test('fetch with rejected promise', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetcher.fetch('/data')).rejects.toThrow('Network error');
    });

    test('fetch with plugin that throws an error', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const errorPlugin = createTestBeforePlugin(
        {
          throwOnError: true,
        },
        () => {
          throw new Error('Plugin error');
        }
      );
      fetcher.use(errorPlugin);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      await expect(fetcher.fetch('/data')).rejects.toThrow('Plugin error');
    });
    test('fetch with plugin that throws an error but the fetcher handle is', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      const errorPlugin = createTestBeforePlugin(
        {
          throwOnError: false,
        },
        () => {
          throw new Error('Plugin error');
        }
      );
      fetcher.use(errorPlugin);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      await expect(fetcher.fetch('/data')).resolves.toEqual(
        createFetchResponse(mockResponseData)
      );
    });

    test('fetch without options', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data');

      expect(await result.json()).toEqual(mockResponseData);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {});
    });

    test('fetch without plugins', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data', {
        headers: {
          'X-test': 'test',
        },
      });

      expect(await result.json()).toEqual(mockResponseData);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: {
          'X-test': 'test',
        },
      });
    });

    test('fetch with empty plugins array', async () => {
      const baseUrl = 'https://example.com';
      const fetcher = new Fetcher(baseUrl);

      mockFetch.mockResolvedValueOnce(createFetchResponse(mockResponseData));

      const result = await fetcher.fetch('/data', {
        headers: {
          'X-test': 'test',
        },
      });

      expect(await result.json()).toEqual(mockResponseData);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data', {
        headers: {
          'X-test': 'test',
        },
      });
    });
  });
});

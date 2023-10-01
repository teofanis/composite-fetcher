/* eslint-disable import/no-extraneous-dependencies */
import { Fetcher } from '@composite-fetcher/core';
import { InMemoryCacheDriver } from '@/drivers';
import _fetchMock from 'isomorphic-fetch';
/* eslint-disable new-cap */
import withCachingPlugin from '@/withCaching';

type FetchMock = typeof import('fetch-mock');
const fetchMock = _fetchMock as unknown as FetchMock;

describe('Integration Tests: withCachingPlugin', () => {
  let fetcher: Fetcher;
  let testCacheDriver: InMemoryCacheDriver;

  beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
    global.Request = fetchMock.config.Request as unknown as typeof Request;
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    global.Headers = fetchMock.config.Headers as unknown as typeof Headers;
    testCacheDriver = new InMemoryCacheDriver();
    fetcher = new Fetcher();
    const cachingPlugin = new withCachingPlugin(testCacheDriver);
    fetcher.use(cachingPlugin);
    fetchMock.get('*', {
      status: 200,
      body: {},
      headers: {},
    });
  });

  it('should cache responses on successful requests', async () => {
    fetchMock.get('https://example.com', 200);

    await fetcher.fetch('https://example.com');

    const cacheKey = 'GET-https://example.com/?-';
    const cached = await testCacheDriver.has(cacheKey);
    expect(cached).toBe(true);
  });

  it('should not cache responses when requests are with x-fetcher-no-cache header', async () => {
    await fetcher.fetch('https://example.com', {
      headers: { 'x-fetcher-no-cache': 'true' },
    });
    const cacheKey = 'GET-https://example.com/?-';
    const cached = await testCacheDriver.has(cacheKey);
    expect(cached).toBe(false);
  });

  it('should return cached response on repeated requests', async () => {
    const cacheKey = 'GET-https://example.com/?-';

    expect(await testCacheDriver.has(cacheKey)).toBe(false);

    await fetcher.fetch('https://example.com'); // First request
    expect(await testCacheDriver.has(cacheKey)).toBe(true);

    const response = await fetcher.fetch('https://example.com'); // Second request
    const cachedResponse = await testCacheDriver.get(cacheKey);
    expect(cachedResponse).not.toBe(null);
    expect(cachedResponse!.status).toBe(response.status);
    expect(await cachedResponse!.text()).toBe(await response.text());

    expect(fetchMock.calls('https://example.com').length).toBe(1);
  });

  it('should bypass cache when x-fetcher-no-cache header is set in the request', async () => {
    const headers = { 'x-fetcher-no-cache': 'true' };
    await fetcher.fetch('https://example.com', { headers }); // First request

    const response = await fetcher.fetch('https://example.com'); // Second request

    expect(response.status).toBe(200);
    expect(fetchMock.calls('https://example.com').length).toBe(2);
  });

  it('should respect x-fetcher-cache-ttl header for setting expiration', async () => {
    fetchMock.get('https://example.com', 200);

    const headers = { 'x-fetcher-cache-ttl': '1000' }; // 1 second
    await fetcher.fetch('https://example.com', { headers });

    // Simulate waiting for the cache to expire
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });

    const cacheKey = 'GET-https://example.com/?-';
    const cached = await testCacheDriver.has(cacheKey);
    expect(cached).toBe(false);
  });
});

/* eslint-disable import/no-extraneous-dependencies */
import InMemoryCacheDriver from '@/drivers/InMemoryCacheDriver';
import _fetchMock from 'isomorphic-fetch';

type FetchMock = typeof import('fetch-mock');
const fetchMock = _fetchMock as unknown as FetchMock;

describe('InMemoryCacheDriver', () => {
  let cacheDriver: InMemoryCacheDriver;

  let mockResponse: (bodyContent: string) => Response;

  beforeEach(() => {
    cacheDriver = new InMemoryCacheDriver();
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    mockResponse = (bodyContent: string) =>
      new Response(bodyContent, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
  });

  it('should add an item to the cache', async () => {
    const response = mockResponse('value1');
    await cacheDriver.set('key1', response);
    expect(await cacheDriver.has('key1')).toBeTruthy();
  });

  it('should retrieve an item from the cache', async () => {
    const response = mockResponse('value1');
    await cacheDriver.set('key1', response);
    const cachedResponse = await cacheDriver.get('key1');
    expect(cachedResponse).toBeDefined();
    expect(await cachedResponse!.text()).toBe('value1');
  });

  it('should return null for a non-existent item', async () => {
    const cachedResponse = await cacheDriver.get('nonexistent');
    expect(cachedResponse).toBeNull();
  });

  it('should delete an item from the cache', async () => {
    const response = mockResponse('value1');
    await cacheDriver.set('key1', response);
    expect(await cacheDriver.has('key1')).toBeTruthy();

    await cacheDriver.delete('key1');
    expect(await cacheDriver.has('key1')).toBeFalsy();
  });

  it('should clear all items from the cache', async () => {
    await cacheDriver.set('key1', mockResponse('value1'));
    await cacheDriver.set('key2', mockResponse('value2'));

    await cacheDriver.clear();

    expect(await cacheDriver.has('key1')).toBeFalsy();
    expect(await cacheDriver.has('key2')).toBeFalsy();
  });

  it('should not retrieve expired items', async () => {
    const oneSecondAgo = new Date(Date.now() - 1000);
    await cacheDriver.set('key1', mockResponse('value1'), oneSecondAgo);

    const cachedResponse = await cacheDriver.get('key1');
    expect(cachedResponse).toBeNull();
  });

  it('should automatically remove expired items when checking its existence', async () => {
    const oneSecondAgo = new Date(Date.now() - 1000);
    await cacheDriver.set('key1', mockResponse('value1'), oneSecondAgo);

    // Checking its existence will internally remove it because it's expired
    const exists = await cacheDriver.has('key1');
    expect(exists).toBeFalsy();
  });

  it('should retrieve items that are not yet expired', async () => {
    const tenSecondsFromNow = new Date(Date.now() + 10000);
    await cacheDriver.set('key1', mockResponse('value1'), tenSecondsFromNow);

    const cachedResponse = await cacheDriver.get('key1');
    expect(cachedResponse).toBeDefined();
    expect(await cachedResponse!.text()).toBe('value1');
  });
});

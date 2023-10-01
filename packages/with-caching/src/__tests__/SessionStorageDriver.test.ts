/* eslint-disable import/no-extraneous-dependencies */
import SessionStorageDriver from '@/drivers/SessionStorageDriver';
import _fetchMock from 'isomorphic-fetch';

type FetchMock = typeof import('fetch-mock');
const fetchMock = _fetchMock as unknown as FetchMock;
const mockSessionStorage = {
  data: {} as Record<string, string>,
  setItem(key: string, value: string) {
    this.data[key] = value;
  },
  getItem(key: string) {
    return this.data[key];
  },
  removeItem(key: string) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

describe('SessionStorageDriver', () => {
  let cacheDriver: SessionStorageDriver;
  beforeAll(() => {
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
    });
  });
  beforeEach(() => {
    cacheDriver = new SessionStorageDriver();
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    sessionStorage.clear(); // Ensure sessionStorage is cleared before each test
  });

  it('should add an item to the cache', async () => {
    const response = new Response('value1');
    await cacheDriver.set('key1', response);
    expect(await cacheDriver.has('key1')).toBeTruthy();
  });

  it('should retrieve an item from the cache', async () => {
    const response = new Response('value1');
    await cacheDriver.set('key1', response);
    const retrievedResponse = await cacheDriver.get('key1');
    expect(await retrievedResponse?.text()).toBe('value1');
  });

  it('should return null for a non-existent item', async () => {
    const value = await cacheDriver.get('nonexistent');
    expect(value).toBeNull();
  });

  it('should delete an item from the cache', async () => {
    const response = new Response('value1');
    await cacheDriver.set('key1', response);
    expect(await cacheDriver.has('key1')).toBeTruthy();

    await cacheDriver.delete('key1');
    expect(await cacheDriver.has('key1')).toBeFalsy();
  });

  it('should clear all items from the cache', async () => {
    await cacheDriver.set('key1', new Response('value1'));
    await cacheDriver.set('key2', new Response('value2'));

    await cacheDriver.clear();

    expect(await cacheDriver.has('key1')).toBeFalsy();
    expect(await cacheDriver.has('key2')).toBeFalsy();
  });

  it('should not retrieve expired items', async () => {
    const oneSecondAgo = new Date(Date.now() - 1000);
    await cacheDriver.set('key1', new Response('value1'), oneSecondAgo);

    const value = await cacheDriver.get('key1');
    expect(value).toBeNull();
  });

  it('should automatically remove expired items when checking its existence', async () => {
    const oneSecondAgo = new Date(Date.now() - 1000);
    await cacheDriver.set('key1', new Response('value1'), oneSecondAgo);

    // Checking its existence will internally remove it because it's expired
    const exists = await cacheDriver.has('key1');
    expect(exists).toBeFalsy();
  });

  it('should retrieve items that are not yet expired', async () => {
    const tenSecondsFromNow = new Date(Date.now() + 10000);
    await cacheDriver.set('key1', new Response('value1'), tenSecondsFromNow);

    const retrievedResponse = await cacheDriver.get('key1');
    expect(await retrievedResponse?.text()).toBe('value1');
  });
});

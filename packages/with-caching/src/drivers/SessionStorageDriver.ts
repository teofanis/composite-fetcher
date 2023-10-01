import type { CacheDriver } from '@/interfaces';

export default class SessionStorageDriver implements CacheDriver {
  async set(
    key: string,
    response: Response,
    expirationDate?: Date,
  ): Promise<void> {
    const item = {
      url: response.url,
      value: await response.clone().text(),
      headers: Array.from(response.headers.entries()),
      status: response.status,
      statusText: response.statusText,
      expirationDate: expirationDate?.toISOString(),
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  }

  async get(key: string): Promise<Response | null> {
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);

    if (item.expirationDate && new Date(item.expirationDate) < new Date()) {
      // If the item has expired
      await this.delete(key);
      return null;
    }

    const init: ResponseInit = {
      status: item.status,
      statusText: item.statusText,
      headers: item.headers,
    };

    return new Response(item.value, init);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async delete(key: string): Promise<void> {
    sessionStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    sessionStorage.clear();
  }
}

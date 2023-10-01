/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CacheDriver } from '@/interfaces';

export default class InMemoryCacheDriver implements CacheDriver {
  private cache: Map<string, { value: any; expiration?: Date }>;

  constructor() {
    this.cache = new Map();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expiration && item.expiration <= new Date()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<Response | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiration && item.expiration <= new Date()) {
      this.delete(key);
      return null;
    }
    return this.recreateResponse(item.value);
  }

  async set(key: string, response: Response, expiration?: Date): Promise<void> {
    const serializedResponse = await this.serializeResponse(response);
    this.cache.set(key, { value: serializedResponse, expiration });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private async serializeResponse(response: Response) {
    const body = await response.arrayBuffer();
    return {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers: [...response.headers.entries()],
      body,
    };
  }

  private recreateResponse(data: any): Response {
    return new Response(data.body, {
      status: data.status,
      statusText: data.statusText,
      headers: data.headers,
    });
  }
}

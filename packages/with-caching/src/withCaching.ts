import {
  BasePlugin,
  PluginLifecycleHook,
  type PluginHandlerContext,
} from '@composite-fetcher/core';
import type { CacheDriver, withCachingOptions } from '@/interfaces';
import { InMemoryCacheDriver } from '@/drivers';

export default class withCachingPlugin extends BasePlugin {
  private readonly cacheDriver: CacheDriver;

  private readonly defaultTTL: number = 10 * 60 * 1000; // 10 minutes

  constructor(options: withCachingOptions = {}) {
    super();
    const { cacheDriver, defaultTTL } = options;
    this.cacheDriver = cacheDriver || new InMemoryCacheDriver();
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  private async generateCacheKey(request: Request): Promise<string> {
    const url = new URL(request.url);
    const sortedParams = Array.from(url.searchParams.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    const bodyString = request.body ? JSON.stringify(request.body) : '';
    const cacheKey = `${request.method}-${url.origin}${url.pathname}?${sortedParams}-${bodyString}`;
    return cacheKey;
  }

  private getCacheTTL(milliseconds: number): Date {
    return new Date(Date.now() + milliseconds);
  }

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void | Response> {
    if (context.request.headers.has('x-fetcher-no-cache')) {
      return;
    }
    const cacheKey = await this.generateCacheKey(context.request);
    if (await this.cacheDriver.has(cacheKey)) {
      const cachedResponse = await this.cacheDriver.get(cacheKey);

      if (cachedResponse !== null) {
        // eslint-disable-next-line consistent-return
        return cachedResponse.clone();
      }
    }
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void | Response> {
    const { response, originalRequest } = context;
    if (!originalRequest.headers.has('x-fetcher-no-cache') && response.ok) {
      const cacheTTL = originalRequest.headers.has('x-fetcher-cache-ttl')
        ? Number(originalRequest.headers.get('x-fetcher-cache-ttl'))
        : this.defaultTTL;
      const cacheKey = await this.generateCacheKey(context.originalRequest);
      await this.cacheDriver.set(
        cacheKey,
        response,
        this.getCacheTTL(cacheTTL),
      );
    }
  }
}

export interface CacheDriver {
  has: (key: string) => Promise<boolean>;
  get: (key: string) => Promise<Response | null>;
  set: (key: string, response: Response, expiration?: Date) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}
export interface withCachingOptions {
  cacheDriver?: CacheDriver;
  defaultTTL?: number;
}

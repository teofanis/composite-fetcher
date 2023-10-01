import { Fetcher } from '@composite-fetcher/core';
import {
  SessionStorageDriver,
  withCaching as WithCaching,
} from '@composite-fetcher/with-caching';
import { withLogging as WithLogging } from '@composite-fetcher/with-logging';

const fetcher = new Fetcher();
fetcher.use(new WithLogging());
fetcher.use(new WithCaching({ cacheDriver: new SessionStorageDriver() }));

export default fetcher;

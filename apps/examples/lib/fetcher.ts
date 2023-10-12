/* eslint-disable new-cap */
import { Fetcher } from '@composite-fetcher/core';
import {
  SessionStorageDriver,
  withCaching,
} from '@composite-fetcher/with-caching';
import { withRetries } from '@composite-fetcher/with-retries';

const fetcherWithRetries = new Fetcher();

fetcherWithRetries.use(new withRetries());

const fetcherWithCaching = new Fetcher();
fetcherWithCaching.use(
  new withCaching({
    cacheDriver: new SessionStorageDriver(),
  }),
);

export { fetcherWithRetries, fetcherWithCaching };

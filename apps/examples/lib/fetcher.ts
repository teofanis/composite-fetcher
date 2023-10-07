/* eslint-disable new-cap */
import { Fetcher } from '@composite-fetcher/core';
import { withRetries } from '@composite-fetcher/with-retries';

const fetcher = new Fetcher();

fetcher.use(new withRetries());

export default fetcher;

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
import {
  BasePlugin,
  type PluginHandlerContext,
  type PluginLifecycleHook,
} from '@composite-fetcher/core';
import fetch from 'isomorphic-fetch';

type ResponseType = Awaited<ReturnType<typeof fetch>>;
export default class withRetriesPlugin extends BasePlugin {
  private defaultMaxRetries: number;

  constructor(defaultMaxRetries: number = 3) {
    super();
    this.defaultMaxRetries = defaultMaxRetries;
  }

  private async retryOperation<T extends ResponseType>(
    promiseFn: () => Promise<T>,
    onSuccess: (value: T) => void,
    onFailure: (error: unknown) => void,
    attempt: number = 0,
    retries: number = 0,
  ): Promise<void> {
    try {
      const result = await promiseFn();
      if (result instanceof Response && !result.ok) {
        throw new Error(`HTTP error: ${result.status}`);
      }
      return onSuccess(result);
    } catch (err) {
      if (attempt < retries - 1) {
        return await this.retryOperation(
          promiseFn,
          onSuccess,
          onFailure,
          attempt + 1,
          retries,
        );
      }
      console.error(`Failed after ${retries} attempts`, err);
      onFailure(err);
    }
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    if (
      !context.response.ok &&
      !context.originalRequest.headers.has('x-fetcher-no-retry')
    ) {
      let retries = this.defaultMaxRetries;
      if (context.originalRequest.headers.has('x-fetcher-retry-times')) {
        retries = parseInt(
          context.originalRequest.headers.get('x-fetcher-retry-times')!,
          10,
        );
      }
      const response = await this.retryOperation<Response>(
        async () => fetch(context.originalRequest),
        (res) => res,
        (error) => error,
        0,
        retries,
      );
      return response;
    }
  }
}

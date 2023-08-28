import { FetcherPlugin, PluginOptions } from '@/interfaces';

import { Response } from 'cross-fetch';
import merge from 'lodash.merge';

class BasePlugin implements FetcherPlugin {
  private readonly options: PluginOptions;

  constructor(options: Partial<PluginOptions> = {}) {
    this.options = this.applyDefaultOptions(options);
  }

  private applyDefaultOptions(options: Partial<PluginOptions>): PluginOptions {
    const defaults = {
      mergeOptions: {
        request: true,
        response: true,
      },
      throwOnError: false,
    };
    return merge({}, defaults, options);
  }

  getOptions() {
    return this.options;
  }

  addOptions(options: Partial<PluginOptions> = {}) {
    merge(this.options, options);
    return this;
  }

  async beforeRequest(url: string, options: RequestInit) {
    return options;
  }

  async afterResponse(response: Response) {
    return response;
  }

  async _beforeRequest(url: string, options: RequestInit) {
    const modifiedOptions = await this.beforeRequest(url, options);
    return this.deepMergeRequestOptions(options, modifiedOptions);
  }

  async _afterResponse(response: Response) {
    const modifiedResponse = await this.afterResponse(response);
    return this.deepMergeResponse(response, modifiedResponse);
  }

  async deepMergeRequestOptions(
    baseOptions: RequestInit,
    modifiedOptions: RequestInit
  ) {
    if (!this.options.mergeOptions?.request) {
      return modifiedOptions;
    }
    return merge({}, baseOptions, modifiedOptions);
  }

  async deepMergeResponse(baseResponse: Response, modifiedResponse: Response) {
    if (!this.options.mergeOptions?.response) {
      return modifiedResponse;
    }
    const baseBody = await baseResponse.clone().json();
    const modifiedResponseBody = await modifiedResponse.clone().json();
    const mergedBody = merge({}, baseBody, modifiedResponseBody);

    return new Response(JSON.stringify(mergedBody), {
      ...baseResponse,
      ...modifiedResponse,
    });
  }
}

export default BasePlugin;

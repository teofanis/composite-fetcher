import { FetcherPlugin } from '@/interfaces';
import merge from 'lodash.merge';
import { Response } from 'cross-fetch';
class BasePlugin implements FetcherPlugin {
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
    return merge({}, baseOptions, modifiedOptions);
  }

  async deepMergeResponse(baseResponse: Response, modifiedResponse: Response) {
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

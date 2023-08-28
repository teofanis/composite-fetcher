import { FetcherPlugin } from '@/interfaces';
// import fetch from 'cross-fetch';

export class Fetcher {
  private plugins: FetcherPlugin[] = [];

  constructor(private baseUrl: string) {}

  use(plugin: FetcherPlugin | FetcherPlugin[]): void {
    if (Array.isArray(plugin)) {
      this.plugins.push(...plugin);
    } else {
      this.plugins.push(plugin);
    }
  }
  async applyBeforeRequestPluginActions(
    url: string,
    initialOptions?: RequestInit
  ): Promise<RequestInit> {
    let requestOptions = { ...initialOptions };

    for (const plugin of this.plugins) {
      if (typeof plugin._beforeRequest === 'function') {
        requestOptions = await plugin._beforeRequest(url, requestOptions);
      }
    }

    return requestOptions;
  }

  async applyAfterRequestPluginActions(
    initialResponse: Response
  ): Promise<Response> {
    let response = initialResponse;

    for (const plugin of this.plugins) {
      if (typeof plugin._afterResponse === 'function') {
        const modifiedResponse = await plugin._afterResponse(response);
        if (modifiedResponse) {
          response = modifiedResponse;
        }
      }
    }

    return response;
  }

  async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = new URL(path, this.baseUrl).toString();

    // Apply beforeRequest plugin actions
    const requestOptions = await this.applyBeforeRequestPluginActions(
      url,
      options
    );

    // Fetch the response
    const response = await fetch(url, requestOptions);

    // Apply afterResponse plugin actions
    const finalResponse = await this.applyAfterRequestPluginActions(response);

    return finalResponse;
  }
}

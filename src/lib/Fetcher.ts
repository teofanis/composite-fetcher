import { FetcherPlugin, PluginOptions } from '@/interfaces';
// import fetch from 'cross-fetch';

export class Fetcher {
  private plugins: FetcherPlugin[] = [];

  constructor(private baseUrl: string) {}

  use(
    plugin: FetcherPlugin | FetcherPlugin[],
    pluginOptions?: Partial<PluginOptions>
  ): void {
    if (Array.isArray(plugin)) {
      plugin.forEach((p) => this.use(p, pluginOptions));
    } else {
      this.plugins.push(plugin.addOptions(pluginOptions));
    }
  }
  async applyBeforeRequestPluginActions(
    url: string,
    initialOptions?: RequestInit
  ): Promise<RequestInit> {
    let requestOptions = { ...initialOptions };

    for (const plugin of this.plugins) {
      if (typeof plugin._beforeRequest === 'function') {
        try {
          requestOptions = await plugin._beforeRequest(url, requestOptions);
        } catch (error) {
          if (plugin.getOptions().throwOnError) throw error;
        }
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
        try {
          const modifiedResponse = await plugin._afterResponse(response);
          if (modifiedResponse) {
            response = modifiedResponse;
          }
        } catch (error) {
          if (plugin.getOptions().throwOnError) throw error;
        }
      }
    }

    return response;
  }

  async fetch(path: string, options?: RequestInit): Promise<Response> {
    const url = new URL(path, this.baseUrl).toString();
    const requestOptions = await this.applyBeforeRequestPluginActions(
      url,
      options
    );
    // Fetch the response
    const response = await fetch(url, requestOptions);

    const finalResponse = await this.applyAfterRequestPluginActions(response);

    return finalResponse;
  }
}

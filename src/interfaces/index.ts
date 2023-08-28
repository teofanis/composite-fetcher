export interface FetcherPlugin {
  beforeRequest?(
    url: string,
    options?: RequestInit
  ): Promise<RequestInit> | RequestInit;
  afterResponse?(response: Response): Promise<Response> | Response;
  _beforeRequest?(
    url: string,
    options?: RequestInit
  ): Promise<RequestInit> | RequestInit;
  _afterResponse?(response: Response): Promise<Response> | Response;
  addOptions(options?: Partial<PluginOptions>): FetcherPlugin;
  getOptions(): PluginOptions;
}

export type PluginOptions = {
  mergeOptions: {
    request: boolean;
    response: boolean;
  };
  throwOnError: boolean;
};

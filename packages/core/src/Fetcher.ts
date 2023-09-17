import fetch from 'isomorphic-fetch';

import { Plugin } from '@/interfaces';
import PluginManager from '@/lib/PluginManager';

export default class Fetcher {
  private pluginManager = new PluginManager();

  use(plugin: Plugin | Plugin[]): void {
    this.pluginManager.addPlugins(plugin);
  }

  // test
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const originalRequest = new Request(input, init);
    const modifiedRequest = await this.pluginManager.runPreRequestHooks(
      originalRequest.clone(),
    );
    const response = await fetch(modifiedRequest);
    const modifiedResponse = await this.pluginManager.runPostRequestHooks(
      response.clone(),
      originalRequest.clone(),
    );
    return modifiedResponse;
  }
}

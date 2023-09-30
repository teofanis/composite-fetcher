import type { Plugin } from '@/interfaces';
import PluginManager from '@/lib/PluginManager';
import fetch from 'isomorphic-fetch';

export default class Fetcher {
  private pluginManager = new PluginManager();

  use(plugin: Plugin | Plugin[]): void {
    this.pluginManager.addPlugins(plugin);
  }

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const requestId = this.pluginManager.generateNewRequestId();

    const originalRequest = new Request(input, init);
    const modifiedRequest = await this.pluginManager.runPreRequestHooks(
      requestId,
      originalRequest.clone(),
    );
    if (modifiedRequest instanceof Response) {
      return modifiedRequest; // If a response is returned from the hooks, return it early.
    }
    const response = await fetch(modifiedRequest);
    const modifiedResponse = await this.pluginManager.runPostRequestHooks(
      requestId,
      response.clone(),
      originalRequest.clone(),
    );
    this.pluginManager.clearProcessedPlugins(requestId);
    return modifiedResponse;
  }
}

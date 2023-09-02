import { Plugin, PluginLifecycleHook } from '@/interfaces';

import { clearTimeout } from 'timers';

export class PluginManager {
  private plugins: Plugin[] = [];
  private modifiedRequest!: Request;
  private modifiedResponse!: Response;
  private processedHooks: Record<PluginLifecycleHook, Set<Plugin>> = {
    preRequest: new Set<Plugin>(),
    postRequest: new Set<Plugin>(),
  };

  addPlugins(plugin: Plugin | Plugin[]): void {
    if (Array.isArray(plugin)) {
      this.plugins = this.plugins.concat(plugin);
    } else {
      this.plugins.push(plugin);
    }
  }

  hasBeenProcessed(plugin: Plugin, hook: PluginLifecycleHook): boolean {
    return this.processedHooks[hook].has(plugin);
  }

  timeoutPlugin(plugin: Plugin, onTimeout: () => void): NodeJS.Timeout {
    const timeout = plugin.pluginTimeout || 3000;
    return setTimeout(onTimeout, timeout);
  }

  runPreRequestHooks(request: Request): Promise<Request> {
    return new Promise((resolve) => {
      this.modifiedRequest = request.clone();
      let index = 0;

      const next = () => {
        if (index >= this.plugins.length) {
          resolve(this.modifiedRequest);
          return;
        }

        const plugin = this.plugins[index];
        if (this.hasBeenProcessed(plugin, PluginLifecycleHook.PRE_REQUEST)) {
          index++;
          next();
          return;
        }

        index++;
        this.processedHooks.preRequest.add(plugin);

        const timeOut = this.timeoutPlugin(plugin, next);

        Promise.resolve(
          plugin.onPreRequest?.(this.modifiedRequest, request.clone(), next)
        ).catch((error) => {
          console.error(`Error in plugin: ${error}`);
          clearTimeout(timeOut);
          next();
        });
      };

      next();
    });
  }

  runPostRequestHooks(
    response: Response,
    originalRequest: Request
  ): Promise<Response> {
    return new Promise((resolve) => {
      this.modifiedResponse = response.clone();
      let index = 0;
      const next = () => {
        if (index >= this.plugins.length) {
          resolve(this.modifiedResponse);
          return;
        }

        const plugin = this.plugins[index];

        if (this.hasBeenProcessed(plugin, PluginLifecycleHook.POST_REQUEST)) {
          index++;
          next();
          return;
        }

        index++;
        this.processedHooks.postRequest.add(plugin);
        const timeOut = this.timeoutPlugin(plugin, next);

        Promise.resolve(
          plugin.onPostRequest?.(
            this.modifiedResponse,
            originalRequest,
            this,
            next
          )
        ).catch((error) => {
          console.error(`Error in plugin: ${error}`);
          clearTimeout(timeOut);
          next();
        });
      };

      next();
    });
  }

  getModifiedRequest(): Request {
    return this.modifiedRequest;
  }

  getModifiedResponse(): Response {
    return this.modifiedResponse;
  }

  getPlugins(): Plugin[] {
    return this.plugins;
  }
}

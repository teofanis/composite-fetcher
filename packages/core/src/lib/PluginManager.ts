/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable import/no-cycle */
import {
  Plugin,
  PluginHandlerContext,
  PluginLifecycleHook,
} from '@/interfaces';

export default class PluginManager {
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

  private hasBeenProcessed(plugin: Plugin, hook: PluginLifecycleHook): boolean {
    return this.processedHooks[hook].has(plugin);
  }

  private isPreRequestContext(
    context: PluginHandlerContext<PluginLifecycleHook>,
  ): context is PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST> {
    return (
      'request' in context &&
      context.request instanceof Request &&
      context.originalRequest instanceof Request
    );
  }

  private isPostRequestContext(
    context: PluginHandlerContext<PluginLifecycleHook>,
  ): context is PluginHandlerContext<PluginLifecycleHook.POST_REQUEST> {
    return (
      'response' in context &&
      context.response instanceof Response &&
      context.originalRequest instanceof Request
    );
  }

  private processPlugins<T>(
    hook: PluginLifecycleHook,
    context: T extends PluginLifecycleHook.PRE_REQUEST
      ? PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
      : PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
    resolve: (value: Request | Response) => void,
  ) {
    let index = 0;
    const isPreRequestContext = this.isPreRequestContext(context);
    const isPostRequestContext = this.isPostRequestContext(context);

    const next = () => {
      if (index >= this.plugins.length) {
        if (isPreRequestContext) {
          resolve(context.request);
        } else if (isPostRequestContext) {
          resolve(context.response);
        }
        return;
      }

      const plugin = this.plugins[index];

      if (this.hasBeenProcessed(plugin, hook)) {
        index++;
        next();
        return;
      }

      index++;
      this.processedHooks[hook].add(plugin);

      const timeout = setTimeout(() => {
        console.error(`Plugin timed out: ${plugin.constructor.name}`);
        context.next();
      }, plugin.pluginTimeout || 3000);

      const method = isPreRequestContext ? 'onPreRequest' : 'onPostRequest';

      context.next = () => {
        clearTimeout(timeout);
        next();
      };

      Promise.resolve(plugin[method]?.(context as any)).catch((error) => {
        console.error(`Error in plugin: ${error}`);
        context.next();
      });
    };

    next();
  }

  runPreRequestHooks(request: Request): Promise<Request> {
    return new Promise((resolve) => {
      this.modifiedRequest = request.clone();
      const context = {
        request: this.modifiedRequest,
        originalRequest: request,
        next: () => {},
        pluginManager: this,
      } as PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>;

      this.processPlugins<PluginLifecycleHook.PRE_REQUEST>(
        PluginLifecycleHook.PRE_REQUEST,
        context,
        resolve as any,
      );
    });
  }

  runPostRequestHooks(
    response: Response,
    originalRequest: Request,
  ): Promise<Response> {
    return new Promise((resolve) => {
      this.modifiedResponse = response.clone();
      const context = {
        response: this.modifiedResponse,
        originalRequest,
        next: () => {},
        pluginManager: this,
      } as PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>;

      this.processPlugins<PluginLifecycleHook.POST_REQUEST>(
        PluginLifecycleHook.POST_REQUEST,
        context,
        resolve as any,
      );
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

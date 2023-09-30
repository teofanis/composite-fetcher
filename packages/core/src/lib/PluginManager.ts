/* eslint-disable @typescript-eslint/indent */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable import/no-cycle */
import {
  type Plugin,
  type PluginHandlerContext,
  PluginLifecycleHook,
} from '@/interfaces';

export default class PluginManager {
  private plugins: Plugin[] = [];

  private requestIdCounter = 0;

  private modifiedRequest!: Request;

  private modifiedResponse!: Response;

  private processedHooks: Map<
    number,
    Record<PluginLifecycleHook, Set<Plugin>>
  > = new Map();

  addPlugins(plugin: Plugin | Plugin[]): void {
    if (Array.isArray(plugin)) {
      this.plugins = this.plugins.concat(plugin);
    } else {
      this.plugins.push(plugin);
    }
  }

  private hasBeenProcessed(
    requestId: number,
    plugin: Plugin,
    hook: PluginLifecycleHook,
  ): boolean {
    if (!this.processedHooks.has(requestId)) {
      return false;
    }
    const hooksForRequest = this.processedHooks.get(requestId)!;
    return hooksForRequest && hooksForRequest[hook].has(plugin);
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
    requestId: number,
    hook: PluginLifecycleHook,
    context: T extends PluginLifecycleHook.PRE_REQUEST
      ? PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
      : PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
    resolve: (value: Request | Response) => void,
  ) {
    let index = 0;
    const isPreRequestContext = this.isPreRequestContext(context);
    const isPostRequestContext = this.isPostRequestContext(context);

    const next = async () => {
      if (index >= this.plugins.length) {
        if (isPreRequestContext) {
          resolve(context.request);
        } else if (isPostRequestContext) {
          resolve(context.response);
        }
        return;
      }

      const plugin = this.plugins[index]!;

      if (this.hasBeenProcessed(requestId, plugin, hook)) {
        index++;
        next();
        return;
      }

      index++;
      this.processedHooks.get(requestId)![hook].add(plugin);

      const timeout = setTimeout(() => {
        console.error(`Plugin timed out: ${plugin.constructor.name}`);
        context.next();
      }, plugin.pluginTimeout || 3000);

      const method = isPreRequestContext ? 'onPreRequest' : 'onPostRequest';

      context.next = () => {
        clearTimeout(timeout);
        next();
      };

      const result = await plugin[method]?.(context as any).catch((error) => {
        console.error(`Error in plugin: ${error}`);
        clearTimeout(timeout);
        context.next();
      });

      if (result instanceof Response) {
        clearTimeout(timeout);
        resolve(result);
        return;
      }

      context.next();
    };

    next();
  }

  runPreRequestHooks(
    requestId: number,
    request: Request,
  ): Promise<Request | Response> {
    return new Promise((resolve) => {
      this.modifiedRequest = request.clone();
      const context = {
        request: this.modifiedRequest,
        originalRequest: request,
        next: () => {},
        pluginManager: this,
      } as PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>;

      this.processPlugins<PluginLifecycleHook.PRE_REQUEST>(
        requestId,
        PluginLifecycleHook.PRE_REQUEST,
        context,
        resolve as any,
      );
    });
  }

  runPostRequestHooks(
    requestId: number,
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
        requestId,
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

  public generateNewRequestId(): number {
    const newId = this.requestIdCounter++;
    this.processedHooks.set(newId, {
      preRequest: new Set<Plugin>(),
      postRequest: new Set<Plugin>(),
    });
    return newId;
  }

  public clearProcessedPlugins(requestId: number) {
    this.processedHooks.delete(requestId);
  }
}

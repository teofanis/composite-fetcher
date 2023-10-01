/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
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

  private processingContext: Map<
    number,
    { request?: Request; response?: Response }
  > = new Map();

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

  private async processPlugins<T>(
    requestId: number,
    hook: PluginLifecycleHook,
    context: T extends PluginLifecycleHook.PRE_REQUEST
      ? PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
      : PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
    resolve: (value: Request | Response) => void,
  ) {
    for (let index = 0; index < this.plugins.length; index++) {
      const plugin = this.plugins[index]!;

      if (this.hasBeenProcessed(requestId, plugin, hook)) {
        // console.log('Plugin already processed', plugin.constructor.name, hook);
        continue;
      }

      // console.log(`Running plugin: ${plugin.constructor.name}`, hook);
      this.processedHooks.get(requestId)![hook].add(plugin);

      const method = this.isPreRequestContext(context)
        ? 'onPreRequest'
        : 'onPostRequest';

      try {
        const result = await plugin[method]?.(context as any);

        if (result instanceof Response) {
          resolve(result);
          return;
        }

        if (this.isPreRequestContext(context)) {
          context.request = this.processingContext.get(requestId)!.request!;
        } else if (this.isPostRequestContext(context)) {
          context.response = this.processingContext.get(requestId)!.response!;
        }
      } catch (error) {
        console.error(`Error in plugin: ${error}`);
        continue;
      }
    }

    if (this.isPreRequestContext(context)) {
      resolve(context.request);
    } else if (this.isPostRequestContext(context)) {
      resolve(context.response);
    }
  }

  runPreRequestHooks(
    requestId: number,
    request: Request,
  ): Promise<Request | Response> {
    return new Promise((resolve) => {
      const modifiedRequest = request.clone();
      this.processingContext.set(requestId, { request: modifiedRequest });

      const context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST> = {
        request: modifiedRequest,
        originalRequest: request,
        pluginManager: this,
      };

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
      const modifiedResponse = response.clone();
      if (!this.processingContext.has(requestId)) {
        this.processingContext.set(requestId, {});
      }

      this.processingContext.get(requestId)!.response = modifiedResponse;

      const context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST> = {
        response: modifiedResponse,
        originalRequest,
        pluginManager: this,
      };

      this.processPlugins<PluginLifecycleHook.POST_REQUEST>(
        requestId,
        PluginLifecycleHook.POST_REQUEST,
        context,
        resolve as any,
      );
    });
  }

  getModifiedRequest(requestId: number): Request {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    return this.processingContext.get(requestId)?.request!;
  }

  getModifiedResponse(requestId: number): Response {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    return this.processingContext.get(requestId)?.response!;
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

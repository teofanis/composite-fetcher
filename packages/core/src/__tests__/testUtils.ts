/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { PluginHandlerContext, PluginLifecycleHook } from '@/interfaces';
import BasePlugin from '@/lib/BasePlugin';

export class DummyPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { next, request } = context;
    request.headers.set('X-Dummy-Header', 'test-request-header');
    next();
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    const { next, response } = context;
    response.headers.set('X-Dummy-Header', 'test-response-header');
    next();
  }
}

export class ErrorPlugin extends BasePlugin {
  async onPreRequest(): Promise<void> {
    throw new Error('This is a dummy error');
  }

  async onPostRequest(): Promise<void> {
    throw new Error('This is a dummy error');
  }
}
export class TimeoutPlugin extends BasePlugin {
  pluginTimeout = 1000;

  async onPreRequest(): Promise<void> {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

export class RequestModifierPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { request, next } = context;
    request.headers.set('X-Custom-Header', 'test');
    next();
  }
}
export class MultipleNextPlugin extends BasePlugin {
  public callCount = 0;

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { next } = context;
    this.callCount++;
    next();
    next();
  }
}
export class CountingPlugin extends BasePlugin {
  public callCount = 0;

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    this.callCount++;
    context.next();
  }
}

export class RequestHeaderPluginTwo extends BasePlugin {
  private headerName: string;

  private headerValue: string;

  constructor(headerName: string, headerValue: string) {
    super();
    this.headerName = headerName;
    this.headerValue = headerValue;
  }

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { request, next } = context;
    const currentHeaderValue = request.headers.get(this.headerName) || '';
    request.headers.set(
      this.headerName,
      currentHeaderValue
        ? `${currentHeaderValue},${this.headerValue}`
        : this.headerValue,
    );
    next();
  }
}
export class ResponseModifierPlugin extends BasePlugin {
  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    context.response.headers.set('X-Custom-Header', 'test');
    context.next();
  }
}

export class ResponseHeaderPluginTwo extends BasePlugin {
  private headerName: string;

  private headerValue: string;

  constructor(headerName: string, headerValue: string) {
    super();
    this.headerName = headerName;
    this.headerValue = headerValue;
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    const currentHeaderValue =
      context.response.headers.get(this.headerName) || '';
    context.response.headers.set(
      this.headerName,
      currentHeaderValue
        ? `${currentHeaderValue},${this.headerValue}`
        : this.headerValue,
    );
    context.next();
  }
}

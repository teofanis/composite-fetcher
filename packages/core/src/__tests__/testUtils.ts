/* eslint-disable no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { type PluginHandlerContext, PluginLifecycleHook } from '@/interfaces';
import BasePlugin from '@/lib/BasePlugin';

export class DummyPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { request } = context;
    request.headers.set('X-Dummy-Header', 'test-request-header');
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    const { response } = context;
    response.headers.set('X-Dummy-Header', 'test-response-header');
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

export class LogPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { request } = context;
    console.log('request to', request.url);
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<Response | void> {
    const { response } = context;
    console.log('response from', response.url);
  }
}

export class RequestModifierPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const { request } = context;
    request.headers.set('X-Custom-Header', 'test');
  }
}
export class MultipleNextPlugin extends BasePlugin {
  public callCount = 0;

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    this.callCount++;
  }
}
export class CountingPlugin extends BasePlugin {
  public callCount = 0;

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    this.callCount++;
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
    const { request } = context;
    const currentHeaderValue = request.headers.get(this.headerName) || '';
    request.headers.set(
      this.headerName,
      currentHeaderValue
        ? `${currentHeaderValue},${this.headerValue}`
        : this.headerValue,
    );
  }
}
export class ResponseModifierPlugin extends BasePlugin {
  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    context.response.headers.set('X-Custom-Header', 'test');
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
  }
}

export class EarlyReturnPlugin extends BasePlugin {
  async onPreRequest(): Promise<void | Response> {
    return new Response('Mock response', {
      status: 418,
    });
  }
}
export class EarlyResponsePostRequestPlugin extends BasePlugin {
  async onPostRequest(): Promise<Response> {
    return new Response('Early response from plugin!', {
      status: 418,
    });
  }
}

export class PassThroughPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {}

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {}
}

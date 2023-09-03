import { PluginHandlerContext, PluginLifecycleHook } from '@/interfaces';
import { Request, Response } from 'cross-fetch';
import { describe, expect, test } from 'vitest';

import { BasePlugin } from '@/lib/plugins';
import { PluginManager } from '@/lib/PluginManager';

class TestPlugin extends BasePlugin {}
class SlowPLugin extends BasePlugin {
  pluginTimeout = 1000;
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
  ): Promise<void> {
    const { request, next } = context;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    request.headers.set('SlowPlugin', 'test');
    next();
  }
}
class FastPlugin extends BasePlugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
  ): Promise<void> {
    const { request, next } = context;
    request.headers.set('FastPlugin', 'test');
    next();
  }
}

describe('PluginManager', () => {
  test('should add a plugin', () => {
    const pluginManager = new PluginManager();
    const plugin = new TestPlugin();

    pluginManager.addPlugins(plugin);

    expect(pluginManager.getPlugins()).toEqual([plugin]);
  });

  test('should add multiple plugins', () => {
    const pluginManager = new PluginManager();
    const plugins = [new TestPlugin(), new TestPlugin()];

    pluginManager.addPlugins(plugins);

    expect(pluginManager.getPlugins()).toEqual(plugins);
  });

  test('should run pre-request hooks', async () => {
    const pluginManager = new PluginManager();
    const plugin = new TestPlugin();
    plugin.onPreRequest = async ({ request, next }) => {
      request.headers.set('Test', 'test');
      next();
    };

    pluginManager.addPlugins(plugin);

    const request = new Request('/');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);

    expect(modifiedRequest.headers.get('Test')).toEqual('test');
  });

  test('should run post-request hooks', async () => {
    const pluginManager = new PluginManager();
    const plugin = new TestPlugin();
    plugin.onPostRequest = async ({ response, next }) => {
      response.headers.set('Test', 'test');
      next();
    };

    pluginManager.addPlugins(plugin);

    const request = new Request('/');
    const response = new Response();
    const modifiedResponse = await pluginManager.runPostRequestHooks(
      response,
      request
    );

    expect(modifiedResponse.headers.get('Test')).toEqual('test');
  });
  test('should skip a pre-request hook that throws an error and continue', async () => {
    const pluginManager = new PluginManager();
    const plugin1 = new TestPlugin();
    plugin1.onPreRequest = async () => {
      throw new Error('Test error');
    };

    const plugin2 = new TestPlugin();
    plugin2.onPreRequest = async ({ request, next }) => {
      request.headers.set('Test', 'test');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);

    expect(modifiedRequest.headers.get('Test')).toEqual('test');
  });

  test('should skip a post-request hook that throws an error and continue', async () => {
    const pluginManager = new PluginManager();
    const plugin1 = new TestPlugin();
    plugin1.onPostRequest = async () => {
      throw new Error('Test error');
    };

    const plugin2 = new TestPlugin();
    plugin2.onPostRequest = async ({ response, next }) => {
      response.headers.set('Test', 'test');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const response = new Response();
    const modifiedResponse = await pluginManager.runPostRequestHooks(
      response,
      request
    );

    expect(modifiedResponse.headers.get('Test')).toEqual('test');
  });

  test('should return all added plugins', () => {
    const pluginManager = new PluginManager();
    const plugin1 = new TestPlugin();
    const plugin2 = new TestPlugin();

    pluginManager.addPlugins([plugin1, plugin2]);

    expect(pluginManager.getPlugins()).toEqual([plugin1, plugin2]);
  });

  test('should return empty array if there are no plugins', () => {
    const pluginManager = new PluginManager();

    expect(pluginManager.getPlugins()).toEqual([]);
  });

  test('should run pre-request hooks in the order they were added', async () => {
    const pluginManager = new PluginManager();

    const plugin1 = new TestPlugin();
    plugin1.onPreRequest = async ({ request, next }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      request.headers.set('Order', '1');
      next();
    };

    const plugin2 = new TestPlugin();
    plugin2.onPreRequest = async ({ request, next }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      request.headers.set('Order', request.headers.get('Order') + '2');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);
    expect(modifiedRequest.headers.get('Order')).toEqual('12');
  });

  test('should run post-request hooks in the order they were added', async () => {
    const pluginManager = new PluginManager();

    const plugin1 = new TestPlugin();
    plugin1.onPostRequest = async ({ response, next }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      response.headers.set('Order', '1');
      next();
    };

    const plugin2 = new TestPlugin();
    plugin2.onPostRequest = async ({ response, next }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      response.headers.set('Order', response.headers.get('Order') + '2');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const response = new Response();
    const modifiedResponse = await pluginManager.runPostRequestHooks(
      response,
      request
    );

    expect(modifiedResponse.headers.get('Order')).toEqual('12');
  });

  test('should timeout a plugin that takes too long', async () => {
    const pluginManager = new PluginManager();
    const slowPlugin = new SlowPLugin();
    const fastPlugin = new FastPlugin();

    pluginManager.addPlugins([slowPlugin, fastPlugin]);

    const request = new Request('http://example.com/path');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);

    // Check that the FastPlugin header is set, but the SlowPlugin header is not
    expect(modifiedRequest.headers.get('FastPlugin')).toEqual('test');
    expect(modifiedRequest.headers.has('SlowPlugin')).toBeFalsy();
  });

  test('should not process a plugin multiple times if next is called multiple times', async () => {
    const pluginManager = new PluginManager();
    const plugin1 = new TestPlugin();
    plugin1.onPreRequest = async ({ request, next }) => {
      request.headers.set('Test', 'test1');
      next();
      next();
    };
    const plugin2 = new TestPlugin();
    plugin2.onPreRequest = async ({ request, next }) => {
      request.headers.set('Test', 'test2');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);

    expect(modifiedRequest.headers.get('Test')).toEqual('test2');
  });
  test('should process all pre-request and post-request hooks', async () => {
    const pluginManager = new PluginManager();
    const plugin1 = new TestPlugin();
    plugin1.onPreRequest = async ({ request, next }) => {
      request.headers.set('PreRequest1', 'test');
      next();
    };
    plugin1.onPostRequest = async ({ response, next }) => {
      response.headers.set('PostRequest1', 'test');
      next();
    };

    const plugin2 = new TestPlugin();
    plugin2.onPreRequest = async ({ request, next }) => {
      request.headers.set('PreRequest2', 'test');
      next();
    };
    plugin2.onPostRequest = async ({ response, next }) => {
      response.headers.set('PostRequest2', 'test');
      next();
    };

    pluginManager.addPlugins([plugin1, plugin2]);

    const request = new Request('/');
    const modifiedRequest = await pluginManager.runPreRequestHooks(request);

    expect(modifiedRequest.headers.get('PreRequest1')).toEqual('test');
    expect(modifiedRequest.headers.get('PreRequest2')).toEqual('test');

    const response = new Response();
    const modifiedResponse = await pluginManager.runPostRequestHooks(
      response,
      modifiedRequest
    );

    expect(modifiedResponse.headers.get('PostRequest1')).toEqual('test');
    expect(modifiedResponse.headers.get('PostRequest2')).toEqual('test');
  });
});

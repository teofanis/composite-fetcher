import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { BasePlugin } from '@/lib/plugins';
import { Fetcher } from '@/lib/Fetcher';
import { Request } from 'cross-fetch';
import fetchMock from 'fetch-mock';

class TestPlugin extends BasePlugin {}

describe('Fetcher', () => {
  beforeEach(() => {
    fetchMock.reset();
    fetchMock.mock('*', 200);
  });
  afterEach(() => {
    fetchMock.restore();
  });

  test('should add plugins to the plugin manager', () => {
    const fetcher = new Fetcher();
    const plugin = new TestPlugin();

    fetcher.use(plugin);
    // @ts-expect-error - private property
    expect(fetcher.pluginManager.getPlugins()).toEqual([plugin]);
  });

  test('should modify the request and response using the plugins', async () => {
    const fetcher = new Fetcher();
    const plugin = new TestPlugin();
    plugin.onPreRequest = async ({ request, next }) => {
      request.headers.set('Test', 'test');
      next();
    };
    plugin.onPostRequest = async ({ response, next }) => {
      response.headers.set('Test', 'test');
      next();
    };

    fetcher.use(plugin);

    const request = new Request('https://google.com/');
    const response = await fetcher.fetch(request);

    expect(response.headers.get('Test')).toEqual('test');
  });

  test('should handle request and response without any plugins', async () => {
    const fetcher = new Fetcher();
    const request = new Request('https://google.com/');
    const response = await fetcher.fetch(request);

    expect(response.status).toEqual(200);
  });

  test('should handle multiple plugins', async () => {
    const fetcher = new Fetcher();
    const plugin1 = new TestPlugin();
    const plugin2 = new TestPlugin();
    plugin1.onPreRequest = async ({ request, next }) => {
      request.headers.set('Plugin1', 'test1');
      next();
    };
    plugin2.onPostRequest = async ({ response, pluginManager, next }) => {
      expect(pluginManager.getModifiedRequest().headers.get('Plugin1')).toEqual(
        'test1'
      );
      response.headers.set('Plugin2', 'test2');
      next();
    };

    fetcher.use(plugin1);
    fetcher.use(plugin2);

    const request = new Request('https://google.com/');

    const response = await fetcher.fetch(request);

    expect(response.headers.get('Plugin2')).toEqual('test2');
  });

  test('should execute plugins in the order they were added', async () => {
    const fetcher = new Fetcher();
    const plugin1 = new TestPlugin();
    const plugin2 = new TestPlugin();
    const plugin3 = new TestPlugin();
    plugin1.onPreRequest = async ({ request, next }) => {
      request.headers.set('Order', '1');
      next();
    };

    plugin2.onPreRequest = async ({ request, next }) => {
      request.headers.set('Order', request.headers.get('Order') + '2');
      next();
    };

    plugin3.onPreRequest = async ({ request, next }) => {
      request.headers.set('Order', request.headers.get('Order') + '3');
      next();
    };
    plugin3.onPostRequest = async ({ response, pluginManager, next }) => {
      expect(pluginManager.getModifiedRequest().headers.get('Order')).toEqual(
        '123'
      );
      response.headers.set('Order', '123');
      next();
    };

    fetcher.use([plugin1, plugin2, plugin3]);

    const request = new Request('https://google.com/');

    const response = await fetcher.fetch(request);

    expect(response.status).toEqual(200);
    expect(response.headers.get('Order')).toEqual('123');
  });

  test('should handle plugin errors gracefully', async () => {
    const fetcher = new Fetcher();
    const plugin = new TestPlugin();

    plugin.onPreRequest = async () => {
      throw new Error('Test Error');
    };

    fetcher.use(plugin);

    const request = new Request('https://google.com/');

    try {
      await fetcher.fetch(request);
    } catch (e: any) {
      expect(e.message).toEqual('Test Error');
    }
  });

  test('should handle when a plugin does not call next', async () => {
    const fetcher = new Fetcher();
    const plugin = new TestPlugin();

    plugin.onPreRequest = async () => {
      // do not call next
    };

    fetcher.use(plugin);

    const request = new Request('https://google.com/');
    const response = await fetcher.fetch(request);

    expect(response.status).toEqual(200);
  });

  test('should only call each plugin once during a lifecycle', async () => {
    const fetcher = new Fetcher();
    const plugin1 = new TestPlugin();
    const plugin2 = new TestPlugin();
    const plugin3 = new TestPlugin();

    const counters = {
      plugin1: 0,
      plugin2: 0,
      plugin3: 0,
    };

    plugin1.onPreRequest = async ({ next }) => {
      counters.plugin1++;
      next();
    };

    plugin2.onPreRequest = async ({ next }) => {
      counters.plugin2++;
      next();
    };

    plugin3.onPreRequest = async ({ next }) => {
      counters.plugin3++;
      next();
    };
    plugin3.onPostRequest = async ({ next }) => {
      counters.plugin3++;
      next();
    };

    fetcher.use(plugin1);
    fetcher.use(plugin2);
    fetcher.use(plugin3);

    await fetcher.fetch('https://google.com/');

    expect(counters.plugin1).toEqual(1);
    expect(counters.plugin2).toEqual(1);
    expect(counters.plugin3).toEqual(2);
  });
});

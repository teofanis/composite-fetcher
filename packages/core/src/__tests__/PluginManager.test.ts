import PluginManager from '@/lib/PluginManager';
import _fetchMock from 'isomorphic-fetch';
// eslint-disable-next-line import/no-extraneous-dependencies
import fetchMockModule from 'fetch-mock';
import {
  CountingPlugin,
  DummyPlugin,
  ErrorPlugin,
  MultipleNextPlugin,
  RequestHeaderPluginTwo,
  RequestModifierPlugin,
  ResponseHeaderPluginTwo,
  ResponseModifierPlugin,
  TimeoutPlugin,
} from './testUtils';

type FetchMock = typeof fetchMockModule;
const fetchMock = _fetchMock as unknown as FetchMock;

describe('PluginManager', () => {
  let pm: PluginManager;
  beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
    global.Request = fetchMock.config.Request as unknown as typeof Request;
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    pm = new PluginManager();
  });

  describe('Plugin addition', () => {
    test('should add a plugin', () => {
      const plugin = new DummyPlugin();
      pm.addPlugins(plugin);
      expect(pm.getPlugins()).toHaveLength(1);
      const addedPlugin = pm.getPlugins()[0];
      expect(addedPlugin).toBeInstanceOf(DummyPlugin);
      expect(addedPlugin).toBe(plugin);
    });

    test('should add multiple plugins', () => {
      const pluginsToAdd = [
        new RequestModifierPlugin(),
        new ResponseModifierPlugin(),
      ];
      pm.addPlugins(pluginsToAdd);
      expect(pm.getPlugins()).toHaveLength(2);
    });

    test('should return all added plugins', () => {
      const pluginsToAdd = [
        new RequestModifierPlugin(),
        new ResponseModifierPlugin(),
      ];
      pm.addPlugins(pluginsToAdd);
      expect(pm.getPlugins()).toHaveLength(2);
      const addedPlugins = pm.getPlugins();
      addedPlugins.forEach((plugin, index) => {
        expect(plugin).toBeInstanceOf(pluginsToAdd[index]!.constructor);
        expect(plugin).toBe(pluginsToAdd[index]);
      });
    });

    test('should return empty array if there are no plugins', () => {
      expect(pm.getPlugins()).toEqual([]);
    });
  });

  describe('Pre-request hooks', () => {
    test('should run pre-request hooks', async () => {
      pm.addPlugins(new RequestModifierPlugin());
      const request = await pm.runPreRequestHooks(new Request('/test'));
      expect(request.headers.get('X-Custom-Header')).toEqual('test');
    });

    test('should skip a pre-request hook that throws an error and continue', async () => {
      pm.addPlugins([new ErrorPlugin(), new RequestModifierPlugin()]);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const request = await pm.runPreRequestHooks(new Request('/test'));
      expect(request.headers.get('X-Custom-Header')).toEqual('test');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in plugin: Error: This is a dummy error',
      );
      consoleErrorSpy.mockRestore();
    });

    test('should run pre-request hooks in the order they were added', async () => {
      const headerName = 'X-Custom-Header';
      pm.addPlugins([
        new RequestHeaderPluginTwo(headerName, 'value1'),
        new RequestHeaderPluginTwo(headerName, 'value4'),
        new RequestHeaderPluginTwo(headerName, 'value3'),
        new RequestHeaderPluginTwo(headerName, 'value2'),
      ]);
      const request = await pm.runPreRequestHooks(new Request('/test'));
      expect(request.headers.get(headerName)).toEqual(
        'value1,value4,value3,value2',
      );
    });

    test('should timeout a plugin that takes too long', async () => {
      pm.addPlugins(new TimeoutPlugin());
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await pm.runPreRequestHooks(new Request('/test'));
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Plugin timed out: TimeoutPlugin',
      );
      consoleErrorSpy.mockRestore();
    });

    test('should not process a plugin multiple times if next is called multiple times', async () => {
      const plugin = new MultipleNextPlugin();
      pm.addPlugins([plugin]);
      await pm.runPreRequestHooks(new Request('/test'));
      expect(plugin.callCount).toEqual(1);
    });

    test('should skip already processed plugins', async () => {
      const plugin1 = new CountingPlugin();
      const plugin2 = new CountingPlugin();

      pm.addPlugins(plugin1);
      await pm.runPreRequestHooks(new Request('/test1'));

      pm.addPlugins(plugin2);
      pm.addPlugins(plugin1);
      await pm.runPreRequestHooks(new Request('/test2'));

      expect(plugin1.callCount).toEqual(1);
      expect(plugin2.callCount).toEqual(1);
    });

    test('should handle plugin error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      pm.addPlugins(new ErrorPlugin());
      await pm.runPreRequestHooks(new Request('/test'));
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in plugin: Error: This is a dummy error',
      );
      consoleErrorSpy.mockRestore();
    });

    test('should be able to get the modified request with added header', async () => {
      pm.addPlugins(
        new RequestHeaderPluginTwo('X-Modified-By', 'PluginManagerTest'),
      );
      const result = await pm.runPreRequestHooks(new Request('/test'));
      const request = pm.getModifiedRequest();
      expect(request).toBe(result);
      expect(request.headers.get('X-Modified-By')).toEqual('PluginManagerTest');
    });
  });

  describe('Post-request hooks', () => {
    test('should run post-request hooks', async () => {
      pm.addPlugins(new ResponseModifierPlugin());
      const originalResponse = new Response('test', {
        headers: { 'Content-Type': 'text/plain' },
      });
      const response = await pm.runPostRequestHooks(
        originalResponse,
        new Request('/test'),
      );
      expect(response.headers.get('X-Custom-Header')).toEqual('test');
      expect(response.headers.get('Content-Type')).toEqual('text/plain');
    });

    test('should skip a post-request hook that throws an error and continue', async () => {
      pm.addPlugins([new ErrorPlugin(), new ResponseModifierPlugin()]);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const originalResponse = new Response('test', {
        headers: { 'Content-Type': 'text/plain' },
      });
      const response = await pm.runPostRequestHooks(
        originalResponse,
        new Request('/test'),
      );
      expect(response.headers.get('X-Custom-Header')).toEqual('test');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      consoleErrorSpy.mockRestore();
    });

    test('should run post-request hooks in the order they were added', async () => {
      const headerName = 'X-Custom-Response-Header';
      pm.addPlugins([
        new ResponseHeaderPluginTwo(headerName, 'value1'),
        new ResponseHeaderPluginTwo(headerName, 'value2'),
        new DummyPlugin(),
        new ResponseHeaderPluginTwo(headerName, 'value3'),
        new ResponseHeaderPluginTwo(headerName, 'value4'),
      ]);
      const originalResponse = new Response('test', {
        headers: { 'Content-Type': 'text/plain' },
      });
      const response = await pm.runPostRequestHooks(
        originalResponse,
        new Request('/test'),
      );
      expect(response.headers.get('X-Dummy-Header')).toEqual(
        'test-response-header',
      );
      expect(response.headers.get(headerName)).toEqual(
        'value1,value2,value3,value4',
      );
      expect(response.headers.get('Content-Type')).toEqual('text/plain');
    });

    test('should be able to get the modified response with added header', async () => {
      pm.addPlugins(
        new ResponseHeaderPluginTwo('X-Modified-By', 'PluginManagerTest'),
      );
      const originalResponse = new Response('test', {
        headers: { 'Content-Type': 'text/plain' },
      });
      const result = await pm.runPostRequestHooks(
        originalResponse,
        new Request('/test'),
      );
      const response = pm.getModifiedResponse();
      expect(response).toBe(result);
      expect(response.headers.get('Content-Type')).toEqual('text/plain');
      expect(response.headers.get('X-Modified-By')).toEqual(
        'PluginManagerTest',
      );
    });
  });
});

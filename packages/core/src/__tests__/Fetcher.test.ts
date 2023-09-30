import Fetcher from '@/Fetcher';
import _fetchMock from 'isomorphic-fetch';
import {
  CountingPlugin,
  DummyPlugin,
  EarlyResponsePostRequestPlugin,
  EarlyReturnPlugin,
  ErrorPlugin,
  PassThroughPlugin,
  RequestHeaderPluginTwo,
  RequestModifierPlugin,
  ResponseHeaderPluginTwo,
  ResponseModifierPlugin,
  TimeoutPlugin,
} from './testUtils';

type FetchMock = typeof import('fetch-mock');
const fetchMock = _fetchMock as unknown as FetchMock;

describe('Fetcher', () => {
  beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
    global.Request = fetchMock.config.Request as unknown as typeof Request;
    global.Response = fetchMock.config.Response as unknown as typeof Response;
    fetchMock.get('https://example.com/', {
      status: 200,
      body: {},
      headers: {},
    });
  });

  describe('Plugin management', () => {
    test('should add plugins to the plugin manager', () => {
      const fetcher = new Fetcher();
      const plugin = new DummyPlugin();
      fetcher.use(plugin);
      // @ts-expect-error - private property
      expect(fetcher.pluginManager.getPlugins()).toEqual([plugin]);
    });

    test('should handle request and response without any plugins', async () => {
      const fetcher = new Fetcher();
      const request = new Request('https://example.com/');
      const response = await fetcher.fetch(request);
      expect(response.status).toEqual(200);
    });

    test('should handle multiple plugins', async () => {
      const fetcher = new Fetcher();
      const plugin1 = new RequestModifierPlugin();
      const plugin2 = new ResponseModifierPlugin();
      const plugin3 = new DummyPlugin();
      fetcher.use([plugin1, plugin3, plugin2]);
      const request = new Request('https://example.com/');
      const response = await fetcher.fetch(request);
      // @ts-expect-error - private property
      const modifiedRequest = fetcher.pluginManager.getModifiedRequest();
      // @ts-expect-error - private property
      const modifiedResponse = fetcher.pluginManager.getModifiedResponse();
      expect(modifiedRequest.headers.get('X-Dummy-Header')).toEqual(
        'test-request-header',
      );
      expect(modifiedRequest.headers.get('X-Custom-Header')).toEqual('test');
      expect(response.headers.get('X-Custom-Header')).toEqual('test');
      expect(response.headers.get('X-Dummy-Header')).toEqual(
        'test-response-header',
      );
      expect(response).toBe(modifiedResponse);
      expect(modifiedRequest).not.toBe(request);
    });
  });

  describe('Plugin execution order', () => {
    test('should execute plugins in the order they were added', async () => {
      const fetcher = new Fetcher();
      const headerName = 'X-Dummy-Header'; // Matching the header from the Dummy plugin which has both pre-request and post-request hooks

      fetcher.use([
        new DummyPlugin(),
        new RequestHeaderPluginTwo(headerName, 'test1'),
        new ResponseHeaderPluginTwo(headerName, 'test-response-1'),
        new RequestHeaderPluginTwo(headerName, 'test2'),
        new ResponseHeaderPluginTwo(headerName, 'test-response-2'),
        new RequestHeaderPluginTwo(headerName, 'test4'),
      ]);
      const request = new Request('https://example.com/');
      const response = await fetcher.fetch(request);
      expect(response.status).toEqual(200);
      // @ts-expect-error - private property
      const modifiedRequest = fetcher.pluginManager.getModifiedRequest();
      // @ts-expect-error - private property
      const modifiedResponse = fetcher.pluginManager.getModifiedResponse();

      const expectedOrder = {
        request: ['test-request-header', 'test1', 'test2', 'test4'],
        response: [
          'test-response-header',
          'test-response-1',
          'test-response-2',
        ],
      };

      expect(modifiedRequest.headers.get(headerName)).toEqual(
        expectedOrder.request.join(','),
      );
      expect(modifiedResponse.headers.get(headerName)).toEqual(
        expectedOrder.response.join(','),
      );
      expect(request).not.toBe(modifiedRequest);
      expect(response).toBe(modifiedResponse);
    });
  });

  describe('Error handling', () => {
    test('should handle plugin errors gracefully', async () => {
      const fetcher = new Fetcher();
      const plugin = new ErrorPlugin();
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetcher.use(plugin);
      const request = new Request('https://example.com/');
      expect(await (await fetcher.fetch(request)).status).toBe(200);
      expect(spy).toHaveBeenCalledWith(
        'Error in plugin: Error: This is a dummy error',
      );
      spy.mockRestore();
    });

    test('should handle when a plugin does not call next', async () => {
      const fetcher = new Fetcher();
      const plugin = new TimeoutPlugin();
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetcher.use(plugin);
      const request = new Request('https://example.com/');
      const response = await fetcher.fetch(request);
      expect(response.status).toEqual(200);
      expect(spy).toHaveBeenCalledWith('Plugin timed out: TimeoutPlugin');
      spy.mockRestore();
    });
  });

  describe('Plugin lifecycle', () => {
    test('should only call each plugin once during a lifecycle', async () => {
      const fetcher = new Fetcher();
      const plugin = new CountingPlugin();
      const plugin2 = new CountingPlugin();
      fetcher.use([plugin, plugin2, plugin2]);
      await fetcher.fetch('https://example.com/');
      expect(plugin.callCount).toEqual(1);
      expect(plugin2.callCount).toEqual(1);
    });
  });

  describe('Plugin returning Response behavior', () => {
    test('should return response from plugin without executing the fetch', async () => {
      const fetcher = new Fetcher();

      fetcher.use(new EarlyReturnPlugin());
      const request = new Request('https://example.com/');
      const response = await fetcher.fetch(request);

      expect(response.status).toEqual(418);
      expect(await response.text()).toEqual('Mock response');

      // Ensure actual fetch was not called
      expect(fetchMock.calls().length).toBe(0);
    });
  });
});

describe('Fetcher with early response from postRequest hook', () => {
  test('should return early response from onPostRequest even if there are multiple plugins', async () => {
    fetchMock.get('https://example2.com/', {
      status: 200,
      body: 'Original response',
    });

    const fetcher = new Fetcher();
    fetcher.use([
      new PassThroughPlugin(),
      new EarlyResponsePostRequestPlugin(),
      new PassThroughPlugin(),
    ]);

    const request = new Request('https://example2.com/');
    const response = await fetcher.fetch(request);
    const responseBody = await response.text();

    expect(response.status).toEqual(418);
    expect(responseBody).toEqual('Early response from plugin!');
  });
});

describe('Fetcher with early exit from preRequest hook', () => {
  test('should handle early exit from onPreRequest and not execute subsequent plugins', async () => {
    fetchMock.get('https://example3.com/', {
      status: 200,
      body: 'Original response',
    });

    const fetcher = new Fetcher();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const passThroughPlugin = new PassThroughPlugin();
    const errorPlugin = new ErrorPlugin();
    const requestModifierPlugin = new RequestModifierPlugin();

    fetcher.use([passThroughPlugin, errorPlugin, requestModifierPlugin]);

    const request = new Request('https://example3.com/');
    try {
      await fetcher.fetch(request);
      // This part of the code should not be reached
      expect(true).toBe(false);
    } catch (error) {
      // Check that the requestModifierPlugin didn't modify the request
      expect(request.headers.get('X-Custom-Header')).toBeNull();
    }
    expect(spy).toHaveBeenCalledWith(
      'Error in plugin: Error: This is a dummy error',
    );
  });
});

describe('Error Response Handling in Fetcher', () => {
  test('should run post-request plugins even if the server returns an error status', async () => {
    fetchMock.get('https://error-status.com/', {
      status: 500,
      body: 'Internal Server Error',
    });

    const fetcher = new Fetcher();
    const responseModifierPlugin = new ResponseModifierPlugin();
    const spy = jest.spyOn(responseModifierPlugin, 'onPostRequest');

    fetcher.use(responseModifierPlugin);

    const response = await fetcher.fetch('https://error-status.com/');

    // Verify that the plugin's onPostRequest method was called
    expect(spy).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    spy.mockRestore();
  });
});

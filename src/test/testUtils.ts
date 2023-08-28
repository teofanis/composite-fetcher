import { BasePlugin } from '@/lib/plugins';
import { PluginOptions } from '@/interfaces';
import { Response } from 'cross-fetch';

export class MockedResponse extends Response {
  constructor(body: BodyInit, init?: ResponseInit) {
    super(body, init);
  }
}

export function createFetchResponse(body: object, init?: ResponseInit) {
  return new MockedResponse(JSON.stringify(body), init);
}

class TestAfterPlugin extends BasePlugin {
  async afterResponse(response: Response) {
    return Promise.resolve(
      createFetchResponse({
        modified: true,
      })
    );
  }
}

type BeforeRequestFunction = (
  url: string,
  options: RequestInit
) => Promise<RequestInit> | RequestInit;

type AfterResponseFunction = (
  response: Response
) => Promise<Response> | Response;

export class TestBeforePlugin extends BasePlugin {
  async beforeRequest(url: string, options: RequestInit) {
    return { headers: { Authorization: 'Bearer token' } };
  }
}

export function createTestBeforePlugin(
  options: Partial<PluginOptions> = {},
  customImplementation?: BeforeRequestFunction
) {
  const plugin = new TestBeforePlugin(options);
  if (customImplementation) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    plugin.beforeRequest = customImplementation;
  }
  return plugin;
}

export function createTestAfterPlugin(
  options: Partial<PluginOptions> = {},
  customImplementation?: AfterResponseFunction
) {
  const plugin = new TestAfterPlugin(options);
  if (customImplementation) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    plugin.afterResponse = customImplementation;
  }
  return plugin;
}

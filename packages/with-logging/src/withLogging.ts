/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BasePlugin,
  type PluginHandlerContext,
  type PluginLifecycleHook,
} from '@composite-fetcher/core';

import { ConsoleLogger } from '@/ConsoleLogger';
import type { Logger, withLoggingOptions } from '@/interfaces';

export default class withLoggingPlugin extends BasePlugin {
  private logger: Logger;

  constructor(options: withLoggingOptions = {}) {
    super();
    const { logger } = options;
    // If no logger is provided, use ConsoleLogger as the default logger
    this.logger = logger || new ConsoleLogger();
  }

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const logContext = {
      method: context.request.method,
      headers: Array.from(context.request.headers.entries()).reduce(
        // @ts-ignore
        (acc, [key, value]) => {
          // @ts-ignore
          acc[key] = value;
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    this.logger.info(`Outgoing request to: ${context.request.url}`, logContext);
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    const logContext = {
      status: context.response.status,
      statusText: context.response.statusText,
      headers: Array.from(context.response.headers.entries()).reduce(
        // @ts-ignore
        (acc, [key, value]) => {
          // @ts-ignore
          acc[key] = value;
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    this.logger.info(
      `Received response from: ${context.originalRequest.url}`,
      logContext,
    );
  }
}

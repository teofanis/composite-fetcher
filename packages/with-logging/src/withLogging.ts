/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  PluginHandlerContext,
  PluginLifecycleHook,
} from '@composite-fetcher/core';

import { ConsoleLogger } from '@/ConsoleLogger';
import type { Logger } from '@/interfaces';

export default class withLoggingPlugin {
  private logger: Logger;

  constructor(logger?: Logger) {
    // If no logger is provided, use ConsoleLogger as the default logger
    this.logger = logger || new ConsoleLogger();
  }

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void> {
    const logContext = {
      method: context.request.method,
      headers: Array.from(context.request.headers.entries()).reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, any>,
      ),
    };

    this.logger.info(`Incoming request to: ${context.request.url}`, logContext);
    context.next();
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void> {
    const logContext = {
      status: context.response.status,
      statusText: context.response.statusText,
      headers: Array.from(context.response.headers.entries()).reduce(
        (acc, [key, value]) => {
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
    context.next();
  }
}

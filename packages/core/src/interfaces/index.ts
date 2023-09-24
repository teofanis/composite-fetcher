/* eslint-disable @typescript-eslint/indent */
// eslint-disable-next-line import/no-cycle
import PluginManager from '@/lib/PluginManager';

// eslint-disable-next-line no-shadow
export enum PluginLifecycleHook {
  PRE_REQUEST = 'preRequest',
  POST_REQUEST = 'postRequest',
}

export type PreRequestPluginHandlerContext = {
  request: Request;
  originalRequest: Request;
  next: () => void;
  pluginManager: PluginManager;
};

export type PostRequestPluginHandlerContext = {
  response: Response;
  originalRequest: Request;
  next: () => void;
  pluginManager: PluginManager;
};

export type PluginHandlerContext<T> = T extends PluginLifecycleHook.PRE_REQUEST
  ? PreRequestPluginHandlerContext
  : T extends PluginLifecycleHook.POST_REQUEST
  ? PostRequestPluginHandlerContext
  : never;
export interface Plugin {
  pluginTimeout?: number;
  onPreRequest?: (
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ) => Promise<void | Response>;
  onPostRequest?: (
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ) => Promise<void | Response>;
}

import { PluginManager } from '@/lib/PluginManager';
export interface Plugin {
  pluginTimeout?: number;
  onPreRequest?: (
    request: Request,
    originalRequest: Request,
    next: () => void
  ) => Promise<void>;
  onPostRequest?: (
    response: Response,
    originalRequest: Request,
    pluginManager: PluginManager,
    next: () => void
  ) => Promise<void>;
}

export enum PluginLifecycleHook {
  PRE_REQUEST = 'preRequest',
  POST_REQUEST = 'postRequest',
}

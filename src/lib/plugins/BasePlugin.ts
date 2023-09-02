import { Plugin } from '@/interfaces';
import { PluginManager } from '@/lib/PluginManager';

export default abstract class BasePlugin implements Plugin {
  pluginTimeout?: number = 3000;
  async onPreRequest?(
    request: Request,
    originalRequest: Request,
    next: () => void
  ): Promise<void> {
    next();
  }

  async onPostRequest?(
    response: Response,
    originalRequest: Request,
    pluginManager: PluginManager,
    next: () => void
  ): Promise<void> {
    next();
  }
}

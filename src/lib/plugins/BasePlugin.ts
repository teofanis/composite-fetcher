import {
  Plugin,
  PluginHandlerContext,
  PluginLifecycleHook,
} from '@/interfaces';

export default abstract class BasePlugin implements Plugin {
  pluginTimeout?: number = 3000;

  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>
  ): Promise<void> {
    context.next();
  }

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>
  ): Promise<void> {
    context.next();
  }
}

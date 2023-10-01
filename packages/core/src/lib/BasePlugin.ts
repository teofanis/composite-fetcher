/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty-function */
import {
  type Plugin,
  type PluginHandlerContext,
  PluginLifecycleHook,
} from '@/interfaces';

export default abstract class BasePlugin implements Plugin {
  async onPreRequest(
    context: PluginHandlerContext<PluginLifecycleHook.PRE_REQUEST>,
  ): Promise<void | Response> {}

  async onPostRequest(
    context: PluginHandlerContext<PluginLifecycleHook.POST_REQUEST>,
  ): Promise<void | Response> {}
}

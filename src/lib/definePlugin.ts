import { DefinedPlugin, StoreApi } from '../types'

/**
 * Identity helper that provides a typed `store` param and preserves the plugin's return type.
 * The middleware type from the input store is preserved in the output.
 */
export function definePlugin<F extends (store: StoreApi) => StoreApi>(
	pluginFn: F
): ReturnType<F> extends StoreApi<infer StoreState, infer GetMethods, infer SetMethods, any>
	? DefinedPlugin<StoreState, GetMethods, SetMethods>
	: never {
	return pluginFn as any
}

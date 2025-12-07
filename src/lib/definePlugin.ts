import { State, StoreApi } from '../types'

/**
 * Identity helper that provides a typed `store` param and preserves the plugin's return type.
 */
export function definePlugin<F extends (store: StoreApi) => StoreApi>(fn: F) {
	return fn as unknown as <S extends State, G, A, MW>(
		store: StoreApi<S, G, A, MW>
	) => ReturnType<F>
}

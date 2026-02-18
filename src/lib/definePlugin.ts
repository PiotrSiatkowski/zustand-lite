import { State, StoreApi } from '../types'

/**
 * Identity helper that provides a typed `store` param and preserves the plugin's return type.
 * The middleware type (MW) from the input store is preserved in the output.
 */
export function definePlugin<F extends (store: StoreApi) => StoreApi>(fn: F) {
	return fn as unknown as <S extends State, G, A, MW>(
		store: StoreApi<S, G, A, MW>
	) => ReturnType<F> extends StoreApi<infer S2, infer G2, infer A2, any>
		? StoreApi<S2, G2, A2, MW>
		: never
}

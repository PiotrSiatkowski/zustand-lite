import { OverrideGet, OverrideSet, State, StoreApi, StoreApiPlugin } from '../types'

type UnwrapOverrideSet<T> = T extends OverrideSet<{}, infer U, {}> ? U : T
type UnwrapOverrideGet<T> = T extends OverrideGet<{}, infer U, {}> ? U : T

type ExtractGetters<T> = T extends StoreApi<{}, infer G, {}> ? UnwrapOverrideGet<G> : never
type ExtractSetters<T> = T extends StoreApi<{}, {}, infer S> ? UnwrapOverrideSet<S> : never

// Implementation
export function definePlugin<
	In extends StoreApi<any, any, any, any>,
	Out extends StoreApi<any, any, any, any>,
>(p: (store: In) => Out): (store: In) => Out {
	return p
}

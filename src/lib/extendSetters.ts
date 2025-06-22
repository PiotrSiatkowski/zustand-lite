import { Default, SettersBuilder, State, StoreApi } from '../types'

export function extendSetters<
	Builder extends SettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, api: StoreApi<S, Getters, Setters>) {
	return { ...api, set: { ...api.set, ...builder(api) } }
}

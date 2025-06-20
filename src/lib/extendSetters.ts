import { Default, SettersBuilder, State, StoreApi } from '../types'

export function extendSetters<
	Builder extends SettersBuilder<T, Getters, Setters>,
	T extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, thisApi: StoreApi<T, Getters, Setters>) {
	return { ...thisApi, set: { ...thisApi.set, ...builder(thisApi) } } as StoreApi<
		T,
		Getters,
		Setters & ReturnType<Builder>
	>
}

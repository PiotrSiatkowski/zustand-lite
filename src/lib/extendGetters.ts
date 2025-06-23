import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { Default, GettersBuilder, State, StoreApi } from '../types'

export function extendGetters<
	Builder extends GettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	const newGetters = builder(api)

	Object.keys(newGetters).forEach((key) => {
		// @ts-ignore
		api.use[key] = (...args: any[]) =>
			useStoreWithEqualityFn(
				lib,
				() => {
					return newGetters[key](...args)
				},
				shallow
			)
	})

	api.get = Object.assign(api.get, newGetters)
	return api
}

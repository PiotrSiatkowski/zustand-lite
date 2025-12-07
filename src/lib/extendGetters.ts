import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { GettersBuilder, State, StoreApi } from '../types'
import { generateGetFnBase } from './generateGetFnBase'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Adds derived getters to the store.
 *
 * @param builder  Function returning new getter methods.
 * @param api      Current store API to extend.
 * @param lib      Underlying Zustand store.
 */
export function extendGetters<
	Builder extends GettersBuilder<S, Getters>,
	S extends State,
	Getters,
	Setters,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	const methods: any = builder({ get: api.get })
	const getters: any = {}

	Object.keys(methods).forEach((key) => {
		getters[key] = (...args: any[]) =>
			useStoreWithEqualityFn(lib, () => methods[key](...args), shallow)
	})

	api.use = Object.assign(generateUseFnBase(lib), api.use, getters)
	api.get = Object.assign(generateGetFnBase(lib), api.get, methods)
	return api
}

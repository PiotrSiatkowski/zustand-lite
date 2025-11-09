import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { Default, GettersBuilder, State, StoreApi } from '../types'
import { generateGetFn } from './generateGetFn'
import { generateUseFn } from './generateUseFn'

export function extendGetters<
	Builder extends GettersBuilder<S, Getters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	const methods: any = builder({ get: api.get })
	const getters: any = {}

	Object.keys(methods).forEach((key) => {
		getters[key] = (...args: any[]) =>
			useStoreWithEqualityFn(lib, () => methods[key](...args), shallow)
	})

	api.use = Object.assign(generateUseFn(lib), api.use, getters)
	api.get = Object.assign(generateGetFn(lib), api.get, methods)
	return api
}

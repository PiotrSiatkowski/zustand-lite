import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { Default, GettersBuilder, State, StoreApi } from '../types'
import { generateGetFn } from './generateGetFn'
import { generateUseFn } from './generateUseFn'

export function extendGetters<
	Builder extends GettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, store: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	const methods = builder(store)
	const getters = {}

	Object.keys(methods).forEach((key) => {
		// @ts-ignore
		getters[key] = (...args: any[]) =>
			useStoreWithEqualityFn(
				lib,
				() => {
					return methods[key](...args)
				},
				shallow
			)
	})

	store.use = Object.assign(generateUseFn(lib), store.use, getters)
	store.get = Object.assign(generateGetFn(lib), store.get, methods)
	return store
}

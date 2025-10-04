import { StoreApi as StoreLib } from 'zustand/vanilla'
import { Default, SettersBuilder, State, StoreApi } from '../types'
import { generateSetFn } from './generateSetFn'

export function extendSetters<
	Builder extends SettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, store: StoreApi<S, Getters, Setters>, lib: StoreLib<S>, hasDevtools: boolean) {
	const setters = generateSetFn(lib, hasDevtools)
	const baseSet = Object.entries(builder(store)).reduce(
		(acc, [name, func]) => {
			acc[name] = function _zustandLiteInferName_(...args: any[]) {
				return func(...args)
			}

			return acc
		},
		{} as Record<string, any>
	)

	store.set = Object.assign(setters, store.set, baseSet)
	return store
}

import { StoreApi as StoreLib } from 'zustand/vanilla'
import { Default, SettersBuilder, State, StoreApi } from '../types'
import { generateSetFn } from './generateSetFn'

export function extendSetters<
	Builder extends SettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>, log: boolean) {
	const setters = generateSetFn(lib, log)
	const baseSet = Object.entries(builder(api)).reduce(
		(acc, [name, func]) => {
			acc[name] = function _zustandLiteInferName_(...args: any[]) {
				return func(...args)
			}

			return acc
		},
		{} as Record<string, any>
	)

	api.set = Object.assign(setters, api.set, baseSet)
	return api
}

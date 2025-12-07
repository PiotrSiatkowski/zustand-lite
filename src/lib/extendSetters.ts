import { StoreApi as StoreLib } from 'zustand/vanilla'
import { SettersBuilder, State, StoreApi } from '../types'
import { generateSetFnBase } from './generateSetFnBase'

/**
 * Adds custom setter methods to the store.
 *
 * @param builder  Function returning new setter methods.
 * @param api      Store API to extend.
 * @param lib      Underlying Zustand store.
 * @param log      Enables optional debug logging.
 */
export function extendSetters<
	Builder extends SettersBuilder<S, Getters, Setters>,
	S extends State,
	Getters,
	Setters,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>, log: boolean) {
	const setters = generateSetFnBase(lib, log)
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

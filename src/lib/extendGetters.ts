import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { GettersBuilder, State, StoreApi, UseGetterOptions } from '../types'
import { generateGetFnBase } from './generateGetFnBase'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Type guard to check if a value is an equality options object.
 * Detects plain objects with an `eq` property that is a function.
 */
function isEqualityOptions<R>(value: unknown): value is UseGetterOptions<R> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'eq' in value &&
		typeof (value as any).eq === 'function'
	)
}

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
		getters[key] = (...args: any[]) => {
			// Check if the last argument is an equality options object
			const lastArg = args[args.length - 1]
			if (isEqualityOptions(lastArg)) {
				const actualArgs = args.slice(0, -1)
				return useStoreWithEqualityFn(lib, () => methods[key](...actualArgs), lastArg.eq)
			}
			return useStoreWithEqualityFn(lib, () => methods[key](...args), shallow)
		}
	})

	api.use = Object.assign(generateUseFnBase(lib), api.use, getters)
	api.get = Object.assign(generateGetFnBase(lib), api.get, methods)
	return api
}

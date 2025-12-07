import { StoreApi as StoreLib } from 'zustand/vanilla'

import { GetRecord, SetRecord, State, StoreApi, UseRecord } from '../types'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Function that restrict access to the store and store api.
 *
 * @param privateState Property names to be made private like ['foo', 'bar']
 * @param mergedState Final state of the store
 * @param api Returned store API
 * @param lib Zustand api interface
 */
export function restrictState<
	S extends State,
	Key extends keyof S,
	Getters extends GetRecord<any>,
	Setters extends SetRecord<any>,
>(privateState: Key[], mergedState: S, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	return {
		api: api.api,
		set: api.set,
		use: privateState
			? (() => {
					const getters = Object.keys(api.use).reduce(
						(acc, key) =>
							mergedState[key] && (privateState as string[]).includes(key)
								? acc
								: { ...acc, [key]: (api.use as UseRecord<any>)[key] },
						{}
					)

					return Object.assign(generateUseFnBase(lib), getters)
				})()
			: api.use,
		get: privateState
			? (() => {
					const getFn = () =>
						Object.entries(api.get()).reduce(
							(acc, [key, val]) =>
								mergedState[key] && (privateState as string[]).includes(key)
									? acc
									: { ...acc, [key]: val },
							{}
						)

					return Object.assign(getFn, api.get)
				})()
			: api.get,
	}
}

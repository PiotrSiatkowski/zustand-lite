import { StoreApi as StoreLib } from 'zustand/vanilla'

import { GetRecord, SetRecord, State, StoreApi } from '../types'
import { generateUseFn } from './generateUseFn'

/**
 * Function that restrict access to the store and store api.
 * @param privateState Property names to be made private like ['foo', 'bar']
 * @param mergedState Final state of the store
 * @param store Returned store API
 * @param lib Zustand api interface
 */
export function restrictState<
	S extends State,
	Key extends keyof S,
	Getters extends GetRecord<any>,
	Setters extends SetRecord<any>,
>(privateState: Key[], mergedState: S, store: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	return {
		api: store.api,
		set: store.set,
		use: privateState
			? (() => {
					const getters = Object.keys(store.use).reduce(
						(acc, key) =>
							mergedState[key] && (privateState as string[]).includes(key)
								? acc
								: { ...acc, [key]: store.use[key] },
						{}
					)

					return Object.assign(generateUseFn(lib), getters)
				})()
			: store.use,
		get: privateState
			? (() => {
					const getFn = () =>
						Object.entries(store.get()).reduce(
							(acc, [key, val]) =>
								mergedState[key] && (privateState as string[]).includes(key)
									? acc
									: { ...acc, [key]: val },
							{}
						)

					return Object.assign(getFn, store.get)
				})()
			: store.get,
	}
}

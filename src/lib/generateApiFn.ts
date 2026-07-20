import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { isPromiseLike } from '../utils/object'

/**
 * Exposes the supported vanilla API and augments Zustand persist with a convenient `read`.
 *
 * @param storeLib Underlying Zustand vanilla store.
 */
export function generateApiFn<StoreState extends State>(storeLib: StoreLib<StoreState>) {
	const persistApi = augmentPersist(storeLib)

	return {
		getInitialState: storeLib.getInitialState,
		getState: storeLib.getState,
		setState: storeLib.setState,
		subscribe: storeLib.subscribe,
		...(persistApi ? { persist: persistApi } : {}),
	}
}

function augmentPersist<StoreState extends State>(storeLib: StoreLib<StoreState>) {
	if ('persist' in storeLib) {
		const persistApi: any = storeLib.persist

		// Zustand intentionally exposes storage primitives; `read` unwraps their state envelope.
		persistApi.read = () => readPersistedState(persistApi.getOptions())

		return persistApi
	}
}

function readPersistedState(persistOptions: Record<string, any>) {
	try {
		const storedValue = persistOptions.storage?.getItem(persistOptions.name)

		return isPromiseLike(storedValue)
			? Promise.resolve(storedValue)
					.then((value: any) => value?.state)
					.catch(() => undefined)
			: storedValue?.state
	} catch {
		// Reading persistence is observational; unavailable or malformed storage is non-fatal.
		return undefined
	}
}

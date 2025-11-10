import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

/**
 * Required to wrap original Zustand interface without getState and setState, which are handled
 * by get and set (we should allow only one way of doing certain things).
 * @param lib Zustand api interface
 * @param key Zustand persist local storage key
 */
export function generateApi<S extends State>(lib: StoreLib<S>, key: string) {
	return {
		getInitialState: lib.getInitialState,
		getState: lib.getState,
		persist: augmentPersist(lib, key),
		setState: lib.setState,
		subscribe: lib.subscribe,
	}
}

function augmentPersist<S extends State>(lib: StoreLib<S>, key: string) {
	if ('persist' in lib) {
		const augmented: any = lib.persist
		augmented.read = () => {
			try {
				return JSON.parse(localStorage?.getItem(key) ?? '')?.state
			} catch {
				return undefined
			}
		}

		return augmented
	}
}

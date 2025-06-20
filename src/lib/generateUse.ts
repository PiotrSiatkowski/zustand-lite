import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi } from 'zustand'

import { EqualityChecker, State, UseRecord } from '../types'

/**
 * Generates automatic getters like store.use.foo()
 * @param api Zustand api interface
 */
export function generateUse<T extends State>(api: StoreApi<T>) {
	const getters: UseRecord<T> = {} as UseRecord<T>

	// All of these wrappers are hooks and should obey the rule of hooks.
	Object.keys(api.getState()).forEach((key) => {
		getters[key as keyof T] = (equalityFn: EqualityChecker<T[keyof T]> = shallow) => {
			return useStoreWithEqualityFn(api, (state: T) => state[key as keyof T], equalityFn)
		}
	})

	return getters
}

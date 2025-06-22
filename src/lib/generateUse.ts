import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi } from 'zustand'

import { State, EqualityChecker } from '../types'
import { generateUseStep } from './generateUseStep'

/**
 * Generates automatic getters like store.use.foo()
 * @param api Zustand api interface
 */
export function generateUse<S extends State, U>(api: StoreApi<S>) {
	const getters = (selector: (state: S) => U, equality: EqualityChecker<U> = shallow) => {
		return useStoreWithEqualityFn(api, selector, equality)
	}

	generateUseStep(api.getState(), getters, [], api)
	return getters
}

import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi as StoreLib } from 'zustand'

import { State, EqualityChecker } from '../types'

/**
 * Generates automatic getters like store.use.foo()
 * @param lib Zustand api interface
 */
export function generateUseFn<S extends State, U>(lib: StoreLib<S>) {
	return (selector: (state: S) => U, equality: EqualityChecker<U> = shallow) => {
		return useStoreWithEqualityFn(lib, selector, equality)
	}
}

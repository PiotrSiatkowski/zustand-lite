import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { identity, pick } from '../utils/utils'

/**
 * Generates automatic getters like store.use.foo()
 *
 * @param lib Zustand api interface
 */
export function generateUseFnBase<S extends State, U>(lib: StoreLib<S>) {
	return (selector = identity, equality = shallow) => {
		return useStoreWithEqualityFn(
			lib,
			Array.isArray(selector) ? (s) => pick(s, selector) : (selector ?? identity),
			equality
		)
	}
}

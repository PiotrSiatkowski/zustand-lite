import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'

const identity = (arg: any) => arg
const pick = (obj: Record<string, any>, keys: string[]) =>
	keys.reduce<Record<string, any>>((acc, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc), {})

/**
 * Generates automatic getters like store.use.foo()
 * @param lib Zustand api interface
 */
export function generateUseFn<S extends State, U>(lib: StoreLib<S>) {
	return (selector = identity, equality = shallow) => {
		return useStoreWithEqualityFn(
			lib,
			Array.isArray(selector) ? (s) => pick(s, selector) : (selector ?? identity),
			equality
		)
	}
}

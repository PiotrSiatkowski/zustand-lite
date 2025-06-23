import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { generateUseStep } from './generateUseStep'
import { generateUseFn } from './generateUseFn'

/**
 * Generates automatic getters like store.use.foo()
 * @param lib Zustand api interface
 */
export function generateUse<S extends State>(lib: StoreLib<S>) {
	const getters = generateUseFn(lib)
	generateUseStep(lib.getState(), getters, [], lib)
	return getters
}

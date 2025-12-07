import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { pick } from '../utils/utils'
import { generateUseFnStep } from './generateUseFnStep'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Generates automatic store hook subscribe function store.use()
 *
 * @param lib Zustand api interface
 * @param key State keys to use
 */
export function generateUseFn<S extends State>(lib: StoreLib<S>, key: string[]) {
	const getters = generateUseFnBase(lib)
	generateUseFnStep(pick(lib.getState(), key), getters, [], lib)
	return getters
}

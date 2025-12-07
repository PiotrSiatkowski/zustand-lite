import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { generateUseStep } from './generateUseStep'
import { generateUseFn } from './generateUseFn'
import { pick } from '../utils/utils'

/**
 * Generates automatic store hook subscribe function store.use()
 *
 * @param lib Zustand api interface
 * @param key State keys to use
 */
export function generateUse<S extends State>(lib: StoreLib<S>, key: string[]) {
	const getters = generateUseFn(lib)
	generateUseStep(pick(lib.getState(), key), getters, [], lib)
	return getters
}

import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { pick } from '../utils/utils'
import { generateUseFnStep } from './generateUseFnStep'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Generates the root hook and its state-field hook tree.
 *
 * @param storeLib Underlying Zustand vanilla store.
 * @param stateKeys State keys that receive generated hooks.
 */
export function generateUseFn<StoreState extends State>(
	storeLib: StoreLib<StoreState>,
	stateKeys: string[]
) {
	const useHooks = generateUseFnBase(storeLib)
	const rootState = pick(storeLib.getState(), stateKeys)

	generateUseFnStep(rootState, useHooks, [], storeLib)
	return useHooks
}

import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { StoreApi as StoreLib } from 'zustand'

import { State } from '../types'
import { identity, pick } from '../utils/utils'

/**
 * Creates the root `store.use(...)` hook.
 *
 * @param storeLib Underlying Zustand vanilla store.
 */
export function generateUseFnBase<StoreState extends State, HookResult>(
	storeLib: StoreLib<StoreState>
) {
	return (selector = identity, equality = shallow) => {
		return useStoreWithEqualityFn(
			storeLib,
			Array.isArray(selector) ? (state) => pick(state, selector) : (selector ?? identity),
			equality
		)
	}
}

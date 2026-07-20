import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { isShallowEqualValue } from '../utils/equality'
import { ownEnumerableKeys } from '../utils/object'
import { generateSetterName } from './generateSetterName'

/**
 * Creates the root `store.set(...)` updater with no-op suppression.
 *
 * @param storeLib Underlying Zustand vanilla store.
 * @param shouldLog Whether updates should include devtools metadata.
 */
export function generateSetFnBase<StoreState extends State>(
	storeLib: StoreLib<StoreState>,
	shouldLog: boolean
) {
	return (
		updater:
			| StoreState
			| Partial<StoreState>
			| ((state: StoreState) => StoreState | Partial<StoreState>),
		replace?: boolean,
		actionName?: string
	) => {
		const currentState = storeLib.getState()
		const updateResult = typeof updater === 'function' ? updater(currentState) : updater

		const nextState = (
			replace ? updateResult : { ...currentState, ...updateResult }
		) as StoreState
		const unchanged = replace
			? isShallowEqualValue(currentState, nextState)
			: ownEnumerableKeys(updateResult).every(
					(key) =>
						Object.prototype.hasOwnProperty.call(currentState, key) &&
						isShallowEqualValue(
							(currentState as Record<PropertyKey, unknown>)[key],
							(updateResult as Record<PropertyKey, unknown>)[key]
						)
				)

		if (unchanged) {
			return
		}

		storeLib.setState(
			updateResult,
			replace,
			// @ts-ignore Additional parameter will have no effect even if logging is disabled.
			shouldLog
				? { type: generateSetterName() ?? actionName ?? 'setState', payload: updateResult }
				: undefined
		)
	}
}

import { StoreApi as StoreLib } from 'zustand/vanilla'

import { SetRecord, State } from '../types'
import { isShallowEqualValue } from '../utils/equality'
import { defineEnumerableValue } from '../utils/object'
import { generateSetFnBase } from './generateSetFnBase'
import { generateSetterName } from './generateSetterName'

/**
 * Generates field setters such as `store.set.foo(value)`.
 *
 * @param storeLib Underlying Zustand vanilla store.
 * @param stateKeys State keys that receive setters.
 * @param shouldLog Whether setters should include devtools metadata.
 */
export function generateSetFn<StoreState extends State>(
	storeLib: StoreLib<StoreState>,
	stateKeys: string[],
	shouldLog: boolean
) {
	const setBase: any = generateSetFnBase(storeLib, shouldLog)

	stateKeys.forEach((stateKey) => {
		defineEnumerableValue(setBase, stateKey, (updatedValue: any) => {
			const currentState = storeLib.getState()

			if (
				Object.prototype.hasOwnProperty.call(currentState, stateKey) &&
				isShallowEqualValue(currentState[stateKey], updatedValue)
			) {
				return
			}

			storeLib.setState(
				(state) => ({ ...state, [stateKey]: updatedValue }),
				false,
				// @ts-ignore Additional parameter will have no effect even if logging is disabled.
				shouldLog
					? {
							type: generateSetterName() ?? stateKey,
							payload: { [stateKey]: updatedValue },
						}
					: undefined
			)
		})
	})

	return setBase as SetRecord<StoreState>
}

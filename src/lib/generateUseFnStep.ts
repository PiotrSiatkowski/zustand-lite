import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { defineEnumerableValue, isPlainObject } from '../utils/object'

/**
 * Recursively attaches field hooks such as `store.use.foo()`.
 *
 * @param stateSlice State value at the current depth.
 * @param hookTarget Hook object at the current depth.
 * @param statePath Property path at the current depth.
 * @param storeLib Underlying Zustand vanilla store.
 */
export function generateUseFnStep(
	stateSlice: any,
	hookTarget: any,
	statePath: string[],
	storeLib: any
) {
	if (!isPlainObject(stateSlice)) {
		return
	}

	Object.keys(stateSlice).forEach((stateKey) => {
		const nextPath = [...statePath, stateKey]

		defineEnumerableValue(hookTarget, stateKey, (equalityFn = shallow) => {
			return useStoreWithEqualityFn(
				storeLib,
				(currentState) => getFromPath(currentState, nextPath),
				equalityFn
			)
		})

		// Recurse only through plain objects; opaque values remain leaf hooks.
		generateUseFnStep(stateSlice[stateKey], hookTarget[stateKey], nextPath, storeLib)
	})
}

function getFromPath(rootState: any, statePath: string[]) {
	let currentValue = rootState

	for (const pathKey of statePath) {
		if (
			currentValue === null ||
			currentValue === undefined ||
			(typeof currentValue !== 'object' && typeof currentValue !== 'function')
		) {
			return undefined
		}

		currentValue = currentValue[pathKey]
	}

	return currentValue
}

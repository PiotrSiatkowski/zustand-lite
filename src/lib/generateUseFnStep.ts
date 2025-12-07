import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

/**
 * Generates automatic getters like store.use.foo() (recursive steps for each level).
 * Getters are created as side effects.
 *
 * @param state State at nth level
 * @param getters Getters at nth level
 * @param path Property access path at nth level like ['foo', 'bar']
 * @param lib Zustand api interface
 */
export function generateUseFnStep(state: any, getters: any, path: string[], lib: any) {
	if (typeof state === 'object' && state !== null) {
		Object.keys(state).forEach((key) => {
			const newPath = [...path, key]
			Object.defineProperty(getters, key, {
				value: (equalityFn = shallow) => {
					return useStoreWithEqualityFn(
						lib,
						(state) => getFromPath(state, newPath),
						equalityFn
					)
				},
				writable: true,
				configurable: true,
				enumerable: true,
			})

			generateUseFnStep(state[key], getters[key], newPath, lib)
		})
	}
}

function getFromPath(state: any, path: string[]) {
	let data = state

	for (const key of path) {
		data = data[key]
		if (!data) {
			return data
		}
	}

	return data
}

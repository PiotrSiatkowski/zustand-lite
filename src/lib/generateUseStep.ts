import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

export function generateUseStep(
	state: any,
	getters: any,
	path: string[],
	api: any,
) {
	if (typeof state === 'object' && state !== null) {
		Object.keys(state).forEach((key) => {
			const newPath = [...path, key]
			Object.defineProperty(getters, key, {
				value: (equalityFn = shallow) => {
					return useStoreWithEqualityFn(
						api,
						(state) => getFromPath(state, newPath),
						equalityFn
					)
				},
				writable: true,
				configurable: true,
				enumerable: true,
			})

			generateUseStep(state[key], getters[key], newPath, api)
		})
	}
}

function getFromPath(state: any, path: string[]) {
	let data = state

	for (let key of path) {
		data = data[key]
		if (!data) {
			return data
		}
	}

	return data
}

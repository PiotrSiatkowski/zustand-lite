import { StoreApi as StoreLib } from 'zustand/vanilla'

import { SetRecord, State } from '../types'

function setterName() {
	return new Error()?.stack?.split('\n')[3].trim().split(' ')[1].split('Object.')[1] ?? 'setState'
}

/**
 * Generates automatic setters like store.set.foo(value)
 * @param lib Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateSet<S extends State>(lib: StoreLib<S>, hasDevtools: boolean): SetRecord<S> {
	const setters = (updater: S | ((state: S) => S), replace?: boolean, name?: string) => {
		lib.setState(
			updater,
			replace,
			// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
			hasDevtools ? { type: name ?? setterName(), payload: updater } : undefined
		)
	}

	Object.keys(lib.getState()).forEach((key) => {
		// @ts-ignore
		setters[key] = (value: any) => {
			if (lib.getState()[key] === value) {
				return
			}

			lib.setState(
				(state) => ({ ...state, [key]: value }),
				false,
				// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
				hasDevtools ? { type: key, payload: { [key]: value } } : undefined
			)
		}
	})

	return setters as SetRecord<S>
}

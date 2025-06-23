import { StoreApi as StoreLib } from 'zustand/vanilla'

import { SetRecord, State } from '../types'
import { generateSetFn } from './generateSetFn'

/**
 * Generates automatic setters like store.set.foo(value)
 * @param lib Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateSet<S extends State>(lib: StoreLib<S>, hasDevtools: boolean) {
	const setters = generateSetFn(lib, hasDevtools)

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

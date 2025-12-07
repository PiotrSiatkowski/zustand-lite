import { shallow } from 'zustand/shallow'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { generateSetterName } from './generateSetterName'

/**
 * Generates automatic setState function for store like store.set({ value })
 *
 * @param lib Zustand api interface
 * @param log If devtools were activated for this store
 */
export function generateSetFn<S extends State>(lib: StoreLib<S>, log: boolean) {
	return (updater: S | ((state: S) => S), replace?: boolean, name?: string) => {
		const current = lib.getState()
		const payload = typeof updater === 'function' ? updater(current) : updater

		if (shallow(current, payload)) {
			return
		}

		lib.setState(
			payload,
			replace,
			// @ts-ignore Additional parameter will have no effect even if logging is disabled.
			log ? { type: generateSetterName() ?? name ?? 'setState', payload } : undefined
		)
	}
}

import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import ErrorStackParser from 'error-stack-parser'

/**
 * Generates automatic setState function for store like store.set({ value })
 * @param lib Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateSetFn<S extends State>(lib: StoreLib<S>, hasDevtools: boolean) {
	return (updater: S | ((state: S) => S), replace?: boolean, name?: string) => {
		lib.setState(
			updater,
			replace,
			// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
			hasDevtools ? { type: name ?? 'setState', payload: updater } : undefined
		)
	}
}

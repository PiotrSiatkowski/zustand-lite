import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

// A bit hacky way, but the working method, of obtaining caller function name at any level.
function getSetterName() {
	return new Error()?.stack?.split('\n')[3].trim().split(' ')[1].split('setter.')[1] ?? 'setState'
}

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
			hasDevtools ? { type: name ?? getSetterName(), payload: updater } : undefined
		)
	}
}

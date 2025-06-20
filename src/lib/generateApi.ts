import { StoreApi } from 'zustand/vanilla'

import { State } from '../types'

function setterName() {
	return new Error()?.stack?.split('\n')[3].trim().split(' ')[1].split('.')[1] ?? 'setState'
}

/**
 * Required to wrap original Zustand setState function with default devtools action name.
 * @param api Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateApi<T extends State>(api: StoreApi<T>, hasDevtools: boolean) {
	return {
		...api,
		setState: (newState: T | ((state: T) => T), replace?: boolean, name?: string) => {
			api.setState(
				newState,
				replace,
				// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
				hasDevtools ? { type: name ?? setterName(), payload: newState } : undefined
			)
		},
	}
}

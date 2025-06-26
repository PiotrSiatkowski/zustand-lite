import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

// Properly generate action names for chromium-based browsers and firefox.
function getFunctionNamesFromStack(stack?: string): string[] {
	if (!stack) return []

	return stack
		.split('\n')
		.map((line) => {
			// Chrome / Edge format: "    at functionName (file.js:10:15)"
			const chromeMatch = line.match(/at (\S+)/)
			if (chromeMatch) {
				return chromeMatch[1]
			}

			// Firefox format: "functionName@file.js:10:15"
			const firefoxMatch = line.match(/^(\S+)@/)
			if (firefoxMatch) {
				return firefoxMatch[1]
			}

			return null
		})
		.filter((name): name is string => !!name)
		.map((name) => {
			const split = name.split('.')
			return split?.[1] ?? split?.[0]
		})
}

/**
 * Hacky, but working (and possibly only one there is) method of fetching proper caller
 * name. Used to generate devtools action name from the function name.
 */
function getSetterName() {
	// Proper setter name should hide at 2nd position in the normalized stack.
	return getFunctionNamesFromStack(new Error().stack)?.[2] ?? 'setState'
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

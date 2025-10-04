import { StoreApi as StoreLib } from 'zustand/vanilla'

import { SetRecord, State } from '../types'
import { generateSetFn } from './generateSetFn'
import ErrorStackParser from 'error-stack-parser'

/**
 * Hacky, but working (and possibly only one there is) method of fetching proper caller
 * name of the extended function.
 */
function getSetterName() {
	// Proper setter name should hide at 2nd position in the normalized stack.
	const stack = ErrorStackParser.parse(new Error())
	return stack[3].functionName?.includes('_zustandLiteInferName_') ? stack[2].functionName : null
}

/**
 * Generates automatic setters like store.set.foo(value)
 * @param lib Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateSet<S extends State>(lib: StoreLib<S>, hasDevtools: boolean) {
	const setters: any = generateSetFn(lib, hasDevtools)

	Object.keys(lib.getState()).forEach((key) => {
		setters[key] = (value: any) => {
			if (lib.getState()[key] === value) {
				return
			}

			lib.setState(
				(state) => ({ ...state, [key]: value }),
				false,
				// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
				hasDevtools
					? { type: getSetterName() ?? key, payload: { [key]: value } }
					: undefined
			)
		}
	})

	return setters as SetRecord<S>
}

import { shallow } from 'zustand/shallow'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { SetRecord, State } from '../types'
import { generateSetFn } from './generateSetFn'
import { generateSetterName } from './generateSetterName'

/**
 * Generates automatic setters like store.set.foo(value)
 *
 * @param lib Zustand api interface
 * @param key Keys to generate setters for
 * @param log If devtools were activated for this store
 */
export function generateSet<S extends State>(lib: StoreLib<S>, key: string[], log: boolean) {
	const setters: any = generateSetFn(lib, log)

	key.forEach((key) => {
		setters[key] = (value: any) => {
			if (shallow(lib.getState()[key], value)) {
				return
			}

			lib.setState(
				(state) => ({ ...state, [key]: value }),
				false,
				// @ts-ignore Additional parameter will have no effect even if logging is disabled.
				log ? { type: generateSetterName() ?? key, payload: { [key]: value } } : undefined
			)
		}
	})

	return setters as SetRecord<S>
}

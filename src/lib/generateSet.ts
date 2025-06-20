import { NamedSet } from 'zustand/middleware/devtools'
import { StoreApi } from 'zustand/vanilla'

import { SetRecord, State } from '../types'

/**
 * Generates automatic setters like store.set.foo(value)
 * @param api Zustand api interface
 * @param hasDevtools If devtools were activated for this store
 */
export function generateSet<T extends State>(api: StoreApi<T>, hasDevtools: boolean): SetRecord<T> {
	const setters: SetRecord<T> = {} as SetRecord<T>

	Object.keys(api.getState()).forEach((key) => {
		setters[key as keyof T] = (value: any) => {
			if (api.getState()[key] === value) {
				return
			}

			api.setState(
				(state) => ({ ...state, [key]: value }),
				false,
				// @ts-ignore Additional parameter will have no effect even if devtools are disabled.
				hasDevtools ? { type: key, payload: { [key]: value } } : undefined
			)
		}
	})

	return setters
}

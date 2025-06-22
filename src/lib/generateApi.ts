import { StoreApi } from 'zustand/vanilla'

import { State } from '../types'

/**
 * Required to wrap original Zustand interface without getState and setState, which are handled
 * by get and set.
 * @param api Zustand api interface
 */
export function generateApi<S extends State>(api: StoreApi<S>) {
	return { getInitialState: api.getInitialState, subscribe: api.subscribe }
}

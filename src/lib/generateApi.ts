import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

/**
 * Required to wrap original Zustand interface without getState and setState, which are handled
 * by get and set (we should allow only one way of doing certain things).
 * @param lib Zustand api interface
 */
export function generateApi<S extends State>(lib: StoreLib<S>) {
	return { getInitialState: lib.getInitialState, subscribe: lib.subscribe }
}

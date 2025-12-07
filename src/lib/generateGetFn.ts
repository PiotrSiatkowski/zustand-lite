import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

/**
 * Generates getState function for store.get()
 *
 * @param lib Zustand api interface
 */
export function generateGetFn<S extends State>(lib: StoreLib<S>) {
	return () => lib.getState()
}

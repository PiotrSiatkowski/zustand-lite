import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { generateGetFnBase } from './generateGetFnBase'

/**
 * Generates getters for store.get. In the past getters were generated as functions, but I
 * came to the conclusion that it's better and simpler to return the whole state.
 *
 * @param lib Zustand api interface
 */
export function generateGetFn<S extends State>(lib: StoreLib<S>) {
	return generateGetFnBase(lib)
}

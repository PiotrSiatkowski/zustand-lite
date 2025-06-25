import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { generateGetFn } from './generateGetFn'

/**
 * Generates getters for store.get. In the past getters were generated as functions, but I
 * came to the conclusion that it's better and simpler to return the whole state.
 * @param lib Zustand api interface
 */
export function generateGet<S extends State>(lib: StoreLib<S>) {
	return generateGetFn(lib)
}

import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { generateGetFn } from './generateGetFn'

export function generateGet<S extends State>(lib: StoreLib<S>) {
	return generateGetFn(lib)
}

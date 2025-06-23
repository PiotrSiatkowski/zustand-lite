import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

export function generateGetFn<S extends State>(lib: StoreLib<S>) {
	return () => lib.getState()
}

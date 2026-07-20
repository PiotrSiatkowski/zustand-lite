import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'
import { generateGetFnBase } from './generateGetFnBase'

/**
 * Generates the root `store.get()` accessor.
 *
 * @param storeLib Underlying Zustand vanilla store.
 */
export function generateGetFn<StoreState extends State>(storeLib: StoreLib<StoreState>) {
	return generateGetFnBase(storeLib)
}

import { StoreApi as StoreLib } from 'zustand/vanilla'

import { State } from '../types'

/**
 * Creates the base state accessor shared by generated and extended getters.
 *
 * @param storeLib Underlying Zustand vanilla store.
 */
export function generateGetFnBase<StoreState extends State>(storeLib: StoreLib<StoreState>) {
	return () => storeLib.getState()
}

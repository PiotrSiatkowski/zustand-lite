import { StoreApi } from 'zustand/vanilla'

import { State } from '../types'

export function generateGet<S extends State>(api: StoreApi<S>) {
	return () => api.getState()
}

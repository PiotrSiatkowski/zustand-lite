import { StoreApiPlugin } from '../types'

/**
 * Basic plugin example, that extends store with custom setter.
 */
export const reset: StoreApiPlugin = (store) =>
	store.extendSetters(({ api, set }) => ({
		reset: () => {
			set(api.getInitialState?.() ?? {}, true)
		},
	}))

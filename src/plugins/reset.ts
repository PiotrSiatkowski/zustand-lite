import { StoreApiPlugin } from '../types'

type PluginResetSetters = { reset: () => void }

/**
 * Basic plugin example, that extends store with custom setter.
 */
export const reset: StoreApiPlugin<{}, {}, PluginResetSetters> = {
	extends: (store) => {
		return store.extendSetters(({ api, set }) => ({
			reset: () => {
				set(api.getInitialState?.() ?? {}, true)
			},
		}))
	},
}

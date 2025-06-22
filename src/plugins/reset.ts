import { StoreApiPlugin } from '../types'

type PluginResetSetters = { reset: () => void }

export const reset: StoreApiPlugin<{}, {}, PluginResetSetters> = {
	extends: (store) => {
		return store.extendSetters(({ api, set }) => ({
			reset: () => {
				set(api.getInitialState?.() ?? {}, true)
			},
		}))
	},
}

import { StoreApiPlugin } from '../types'

type PluginResetSetters = { reset: () => void }

export const reset: StoreApiPlugin<{}, {}, PluginResetSetters> = {
	extends: (store) => {
		return store.extendSetters(({ api }) => ({
			reset: () => {
				const initialState = api.getInitialState?.() ?? {}
				api.setState(() => initialState, true)
			},
		}))
	},
}

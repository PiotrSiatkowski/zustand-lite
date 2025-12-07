import { definePlugin } from '../lib/definePlugin'

/**
 * Basic plugin example, that extends store with custom setter.
 */
export const withReset = definePlugin((store) =>
	store.extendSetters(({ api, set }) => ({
		reset: () => {
			set(api.getInitialState?.() ?? {}, true)
		},
	}))
)

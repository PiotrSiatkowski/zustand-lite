/**
 * Entire no-boilerplate functionality inspired by this recipe:
 * https://docs.pmnd.rs/zustand/guides/auto-generating-selectors.
 * It has few utilities described here: https://www.npmjs.com/package/zustand-lite
 * for:
 * 1) Generating getters for flat state (1-level deep selectors).
 * 2) Generating setters for flat state (1-level deep setters).
 * 3) Automatic devtools messaging.
 * 4) Annotating functions with proper TS types to avoid some bloating and TS frenzy.
 * 5) Extending getters and setters
 * 6) Extending state and restricting state
 * 7) Reuse plugins
 *
 * Idea is to support small store without complicated data reducing (it can be done as well,
 * but may indicate something is not right with the use case itself).
 **/
import { devtools, persist } from 'zustand/middleware'
import { createStore as createVanillaStore } from 'zustand/vanilla'

import {
	AugmentedApiData,
	AugmentedGetters,
	AugmentedSetters,
	ByStateBuilder,
	Default,
	GettersBuilder,
	GlobalConfig,
	MWConfiguration,
	SettersBuilder,
	State,
	StoreApi,
	StoreApiPluginList,
	StorePersist,
} from '../types'

import { extendGetters } from './extendGetters'
import { extendSetters } from './extendSetters'
import { extendByState } from './extendByState'
import { generateApi } from './generateApi'
import { generateGet } from './generateGet'
import { generateSet } from './generateSet'
import { generateUse } from './generateUse'
import { restrictState } from './restrictState'

let config: GlobalConfig = { appName: 'zustand-lite', logging: false }

export function setGlobalConfig(newConfig: Partial<GlobalConfig>) {
	config = { ...config, ...newConfig }
}

export function createStore<
	S extends State,
	Plugins extends StoreApiPluginList = [],
	ExtraMW extends MWConfiguration = {},
>(
	initialState: S,
	options?: { name?: string; plugins?: [...Plugins]; middlewares?: ExtraMW }
): StoreApi<
	Plugins extends [] ? S : AugmentedApiData<S, Plugins>,
	Plugins extends [] ? Default : AugmentedGetters<Plugins>,
	Plugins extends [] ? Default : AugmentedSetters<Plugins>,
	ExtraMW extends { persist: any } ? StorePersist<S> : {}
> {
	const { name = 'zustand-lite', plugins = [], middlewares = {} as ExtraMW } = options ?? {}

	// Merge state from plugins to be available for future use.
	let mergedState: any = initialState
	plugins.forEach((plugin) => {
		if (plugin.creates) {
			mergedState = { ...mergedState, ...plugin.creates() }
		}
	})

	// Apply supported middlewares.
	let initializer: any = () => mergedState

	const persistId = `${config.appName.replace(/\s/, '-')}.${name}}`
	const shouldLog = config.logging || !!middlewares.devtools

	if (shouldLog) {
		initializer = devtools(initializer, {
			name: config.appName,
			store: name,
			...(typeof middlewares.devtools === 'object' ? middlewares.devtools : {}),
		})
	}

	if (middlewares.persist) {
		initializer = persist(initializer, {
			name: persistId,
			...(typeof middlewares.persist === 'object' ? middlewares.persist : {}),
		})
	}

	// Create a vanilla zustand store to wrap.
	const storeLib: any = createVanillaStore(initializer)

	// Create zustand-lite wrapper.
	const storeApi: any = {
		api: generateApi(storeLib, persistId),
		get: generateGet(storeLib),
		use: generateUse(storeLib, Object.keys(mergedState)),
		set: generateSet(storeLib, Object.keys(mergedState), shouldLog),
		extendGetters<Builder extends GettersBuilder<typeof mergedState>>(builder: Builder) {
			return extendGetters(builder, this, storeLib)
		},
		extendSetters<Builder extends SettersBuilder<typeof mergedState>>(builder: Builder) {
			return extendSetters(builder, this, storeLib, shouldLog)
		},
		extendByState<Builder extends ByStateBuilder<typeof mergedState>>(builder: Builder) {
			return extendByState(builder, this, storeLib, shouldLog)
		},
		restrictState(publicState = []) {
			return restrictState(publicState, mergedState, this, storeLib)
		},
	}

	// Extend store getters and setters with plugins.
	let result = storeApi
	plugins.forEach((plugin) => {
		if (plugin.extends) {
			result = plugin.extends(storeApi)
		}
	})

	return result
}

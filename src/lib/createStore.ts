/**
 * Entire no-boilerplate functionality inspired by this recipe:
 * https://docs.pmnd.rs/zustand/guides/auto-generating-selectors.
 * It has few utilities described here: https://www.npmjs.com/package/zustand-lite
 * for:
 * 1) Generating getters for flat state (1-level deep selectors).
 * 2) Generating setters for flat state (1-level deep setters).
 * 3) Automatic devtools messaging.
 * 4) Annotating functions with proper TS types to avoid some bloating and TS frenzy.
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
import { generateApi } from './generateApi'
import { generateGet } from './generateGet'
import { generateSet } from './generateSet'
import { generateUse } from './generateUse'
import { restrictState } from './restrictState'

let config: GlobalConfig = { appName: 'zustand-lite', devtools: false }

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

	if (middlewares.devtools || config.devtools) {
		initializer = devtools(
			initializer,
			middlewares.devtools === true || (config.devtools && !middlewares.devtools)
				? { name: config.appName, store: name }
				: { name: config.appName, store: name, ...middlewares.devtools }
		)
	}

	if (middlewares.persist) {
		initializer = persist(
			initializer,
			middlewares.persist === true
				? { name: `${config.appName.replace(/\s/, '-')}.${name}` }
				: { name: `${config.appName.replace(/\s/, '-')}.${name}`, ...middlewares.persist }
		)
	}

	// Create a vanilla zustand store to wrap.
	const storeLib: any = createVanillaStore(initializer)

	// Create zustand-lite wrapper.
	const storeApi: any = {
		api: generateApi(storeLib),
		get: generateGet(storeLib),
		use: generateUse(storeLib),
		set: generateSet(storeLib, !!middlewares.devtools),
		extendGetters<Builder extends GettersBuilder<typeof mergedState>>(builder: Builder) {
			return extendGetters(builder, this, storeLib)
		},
		extendSetters<Builder extends SettersBuilder<typeof mergedState>>(builder: Builder) {
			return extendSetters(builder, this, storeLib, !!middlewares.devtools)
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

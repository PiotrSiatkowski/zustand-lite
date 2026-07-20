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
 * Selector subscriptions are always installed. Persistence and devtools remain opt-in,
 * except that global logging also enables devtools instrumentation.
 */
import { createJSONStorage, devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { createStore as createVanillaStore } from 'zustand/vanilla'

import {
	GlobalConfig,
	MWConfiguration,
	PersistedStateFor,
	PlainState,
	State,
	StoreApi,
	StorePersist,
} from '../types'
import { assertPlainState } from '../utils/object'

import { extendByState } from './extendByState'
import { extendGetters } from './extendGetters'
import { extendSetters } from './extendSetters'
import { generateApiFn } from './generateApiFn'
import { generateGetFn } from './generateGetFn'
import { generateSetFn } from './generateSetFn'
import { generateUseFn } from './generateUseFn'
import { restrictState } from './restrictState'

let globalConfig: GlobalConfig = { appName: 'zustand-lite', logging: false }

export function setGlobalConfig(nextConfig: Partial<GlobalConfig>) {
	globalConfig = { ...globalConfig, ...nextConfig }
}

type MiddlewareApi<StoreState extends State, Middleware> = Middleware extends {
	persist: infer Persist
}
	? Persist extends false | undefined
		? {}
		: StorePersist<StoreState, PersistedStateFor<StoreState, Middleware>>
	: {}

export function createStore<
	StoreState extends State,
	Middleware extends MWConfiguration<StoreState> = {},
>(
	initialState: PlainState<StoreState>,
	options?: {
		name?: string
		middlewares?: Middleware &
			MWConfiguration<StoreState> &
			Record<Exclude<keyof Middleware, keyof MWConfiguration<StoreState>>, never>
	}
): StoreApi<StoreState, {}, {}, MiddlewareApi<StoreState, Middleware>> {
	const { name: storeName = 'zustand-lite', middlewares = {} as Middleware } = options ?? {}

	assertPlainState(initialState, 'Initial state')

	const persistId = `${globalConfig.appName.replace(/\s+/g, '-')}.${storeName}`
	const shouldLog = globalConfig.logging || !!middlewares.devtools
	const persistMW = typeof middlewares.persist === 'object' ? middlewares.persist : {}
	const storageMW = persistMW.storage ?? createJSONStorage(() => localStorage) ?? storageStub

	// Selector subscriptions form the innermost middleware so every outer layer retains them.
	let stateCreator: any = subscribeWithSelector(() => initialState)

	if (middlewares.persist) {
		stateCreator = persist(stateCreator, { name: persistId, ...persistMW, storage: storageMW })
	}

	if (shouldLog) {
		stateCreator = devtools(stateCreator, {
			name: globalConfig.appName,
			store: storeName,
			...(typeof middlewares.devtools === 'object' ? middlewares.devtools : {}),
		})
	}

	const zustandApi: any = createVanillaStore(stateCreator)

	return {
		api: generateApiFn(zustandApi),
		get: generateGetFn(zustandApi),
		use: generateUseFn(zustandApi, Object.keys(initialState)),
		set: generateSetFn(zustandApi, Object.keys(initialState), shouldLog),
		composePlugin(plugin) {
			return plugin(this)
		},
		extendGetters(builder) {
			return extendGetters(builder, this, zustandApi)
		},
		extendSetters(builder) {
			return extendSetters(builder, this, zustandApi, shouldLog)
		},
		extendByState(builder) {
			return extendByState(builder, this, zustandApi, shouldLog)
		},
		restrictState(enclose = []) {
			return restrictState(enclose, this, zustandApi)
		},
	} as any
}

const storageStub = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }

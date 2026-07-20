import { StoreApi as StoreLib } from 'zustand/vanilla'

import { GetRecord, SetRecord, State, StoreApi, UseRecord } from '../types'
import { shallowRecord } from '../utils/equality'
import {
	assignEnumerableProperties,
	defineEnumerableValue,
	isPlainObject,
	isPromiseLike,
	ownEnumerableKeys,
} from '../utils/object'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Builds a public store view that excludes selected root-state fields from every access path.
 *
 * @param privateList Property names to hide, such as `['token', 'internalId']`.
 * @param storeApi Zustand Lite API being restricted.
 * @param storeLib Underlying Zustand vanilla store.
 */
export function restrictState<
	StoreState extends State,
	PrivateKey extends keyof StoreState,
	GetMethods extends GetRecord<any>,
	SetMethods extends SetRecord<any>,
>(
	privateList: PrivateKey[],
	storeApi: StoreApi<StoreState, GetMethods, SetMethods>,
	storeLib: StoreLib<StoreState>
) {
	const privateKeys = new Set<PropertyKey>(
		privateList.map((key) => (typeof key === 'symbol' ? key : String(key)))
	)

	const selectState = <T extends State>(state: T, includeKey: (key: PropertyKey) => boolean) =>
		ownEnumerableKeys(state).reduce<Record<PropertyKey, unknown>>((selectedState, stateKey) => {
			if (includeKey(stateKey)) {
				defineEnumerableValue(
					selectedState,
					stateKey,
					(state as Record<PropertyKey, unknown>)[stateKey]
				)
			}

			return selectedState
		}, {})

	const omitPrivate = <T extends State>(state: T) =>
		selectState(state, (stateKey) => !privateKeys.has(stateKey))
	const retainPrivate = (state: StoreState) =>
		selectState(state, (stateKey) => privateKeys.has(stateKey))

	const setPublicState = (
		setter: (...args: any[]) => unknown,
		updater: any,
		replace?: boolean
	) => {
		const currentState = storeLib.getState()
		const visibleState = omitPrivate(currentState)
		const updateResult = typeof updater === 'function' ? updater(visibleState) : updater
		const visiblePatch = omitPrivate(updateResult ?? {})

		return replace
			? setter({ ...retainPrivate(currentState), ...visiblePatch }, true)
			: setter(visiblePatch, false)
	}

	// Reuse snapshots while visible fields are unchanged so hidden updates do not rerender hooks.
	let publicSnapshot = omitPrivate(storeLib.getState())
	const getPublicState = (state: StoreState) => {
		const nextSnapshot = omitPrivate(state)

		if (shallowRecord(publicSnapshot, nextSnapshot)) {
			return publicSnapshot
		}

		publicSnapshot = nextSnapshot
		return publicSnapshot
	}

	const persistApi = (storeApi.api as any).persist
	const filterPersistedState = (state: unknown) =>
		isPlainObject(state) ? omitPrivate(state) : state

	const sanitizeStorage = (storageApi: any) => {
		if (!storageApi) {
			return undefined
		}

		return {
			getItem: (storageKey: string) => {
				const storedValue = storageApi.getItem(storageKey)
				const filterValue = (storedEntry: any) => {
					// Persist storage wraps state together with metadata such as version.
					if (!storedEntry || typeof storedEntry !== 'object') {
						return storedEntry
					}

					return { ...storedEntry, state: filterPersistedState(storedEntry.state) }
				}

				return isPromiseLike(storedValue)
					? Promise.resolve(storedValue).then(filterValue)
					: filterValue(storedValue)
			},
			setItem: (storageKey: string, storedEntry: any) =>
				storageApi.setItem(storageKey, {
					...storedEntry,
					state: filterPersistedState(storedEntry.state),
				}),
			removeItem: (storageKey: string) => storageApi.removeItem(storageKey),
		}
	}

	const sanitizePersistOptions = () => {
		// Stateful callbacks close over the unrestricted store and therefore cannot be exposed.
		const {
			merge: _merge,
			migrate: _migrate,
			onRehydrateStorage: _onRehydrateStorage,
			partialize: _partialize,
			storage,
			...publicOptions
		} = persistApi.getOptions()

		return { ...publicOptions, storage: sanitizeStorage(storage) }
	}

	const wrapPersistOptions = (nextOptions: any) => {
		const wrappedOptions = { ...nextOptions }

		if (nextOptions.partialize) {
			wrappedOptions.partialize = (state: StoreState) =>
				nextOptions.partialize(omitPrivate(state))
		} else if ('storage' in nextOptions) {
			// Preserve the existing partializer when only storage is replaced.
			const currentPartialize = persistApi.getOptions().partialize
			wrappedOptions.partialize = (state: StoreState) => {
				const publicState = omitPrivate(state)
				return currentPartialize ? currentPartialize(publicState) : publicState
			}
		}

		if (nextOptions.onRehydrateStorage) {
			wrappedOptions.onRehydrateStorage = (state: StoreState) => {
				const afterHydration = nextOptions.onRehydrateStorage(omitPrivate(state))

				return typeof afterHydration === 'function'
					? (hydratedState: StoreState | undefined, hydrationError: unknown) =>
							afterHydration(
								hydratedState ? omitPrivate(hydratedState) : undefined,
								hydrationError
							)
					: undefined
			}
		}

		if (nextOptions.merge) {
			wrappedOptions.merge = (persistedState: unknown, currentState: StoreState) => ({
				...retainPrivate(currentState),
				...omitPrivate(
					nextOptions.merge(
						filterPersistedState(persistedState),
						omitPrivate(currentState)
					)
				),
			})
		}

		if (nextOptions.migrate) {
			wrappedOptions.migrate = (persistedState: unknown, version: number) => {
				const migratedState = nextOptions.migrate(
					filterPersistedState(persistedState),
					version
				)

				return isPromiseLike(migratedState)
					? Promise.resolve(migratedState).then(filterPersistedState)
					: filterPersistedState(migratedState)
			}
		}

		return wrappedOptions
	}

	const publicPersist = persistApi
		? {
				...persistApi,
				getOptions: sanitizePersistOptions,
				read: () => {
					const storedState = persistApi.read()

					return isPromiseLike(storedState)
						? Promise.resolve(storedState).then(filterPersistedState)
						: filterPersistedState(storedState)
				},
				setOptions: (nextOptions: any) =>
					persistApi.setOptions(wrapPersistOptions(nextOptions)),
				onHydrate: (listener: (state: State) => void) =>
					persistApi.onHydrate((state: State) => listener(omitPrivate(state))),
				onFinishHydration: (listener: (state: State) => void) =>
					persistApi.onFinishHydration((state: State) => listener(omitPrivate(state))),
			}
		: undefined

	const publicApi: any = {
		...(storeApi.api as any),
		getInitialState: () => omitPrivate(storeApi.api.getInitialState()),
		getState: () => getPublicState(storeLib.getState()),
		setState: (updater: any, replace?: boolean) =>
			setPublicState(storeLib.setState, updater, replace),
		subscribe: (selectorOrListener: any, listener?: any, options?: any) => {
			// subscribeWithSelector passes a selector and listener; vanilla subscribe passes one.
			if (listener) {
				return (storeLib.subscribe as any)(
					(state: StoreState) => selectorOrListener(getPublicState(state)),
					listener,
					options
				)
			}

			let previousState = getPublicState(storeLib.getState())
			return storeLib.subscribe((state) => {
				const nextState = getPublicState(state)

				if (nextState !== previousState) {
					const previousSnapshot = previousState
					previousState = nextState
					selectorOrListener(nextState, previousSnapshot)
				}
			})
		},
		...(publicPersist ? { persist: publicPersist } : {}),
	}

	const selectPublicMethods = (methods: Record<string, any>) =>
		Object.keys(methods).reduce<Record<PropertyKey, unknown>>((publicMethods, methodName) => {
			if (!privateKeys.has(methodName)) {
				publicMethods[methodName] = methods[methodName]
			}

			return publicMethods
		}, {})

	const publicSet = assignEnumerableProperties(
		(updater: any, replace?: boolean) => setPublicState(storeApi.set as any, updater, replace),
		selectPublicMethods(storeApi.set as any)
	)

	const publicUse = assignEnumerableProperties(
		generateUseFnBase(publicApi),
		selectPublicMethods(storeApi.use as UseRecord<any>)
	)

	const publicGet = assignEnumerableProperties(
		() => getPublicState(storeLib.getState()),
		selectPublicMethods(storeApi.get as any)
	)

	return { api: publicApi, set: publicSet, use: publicUse, get: publicGet }
}

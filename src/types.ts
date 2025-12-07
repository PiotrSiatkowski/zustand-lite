/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-empty-object-type: 0 */
import { StoreApi as StoreApiLib } from 'zustand'
import { DevtoolsOptions, PersistOptions } from 'zustand/middleware'

export type State = Record<string | symbol, unknown>
export type EqualityChecker<S> = (state: S, newState: S) => boolean

type IndexKeys<T> =
	| (string extends keyof T ? string : never)
	| (number extends keyof T ? number : never)
	| (symbol extends keyof T ? string : never)

export type ExplicitKeys<T> = Exclude<keyof T, IndexKeys<T>>

export type Override<T, U> = Omit<T, ExplicitKeys<U>> & U
export type OverrideGet<T, U, S extends Record<string, any>> = GetRecordBase<S> & Override<T, U>
export type OverrideSet<T, U, S extends Record<string, any>> = SetRecordBase<S> & Override<T, U>
export type OverrideUse<T, U, S extends Record<string, any>> = UseRecordBase<S> & Override<T, U>

export type StoreApiEncapsulated<S extends State = {}, Getters = {}, Setters = {}, ExtraMW = {}> = {
	api: StoreApiLib<S> & ExtraMW
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
	use: OverrideUse<UseRecord<S>, Getters, S>
}

export type StoreApi<S extends State = {}, Getters = {}, Setters = {}, ExtraMW = {}> = {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'> & ExtraMW
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
	use: OverrideUse<UseRecord<S>, Getters, S>

	// ✅ compose + merge (override) previous generics with the plugin's additions
	composePlugin<
		P extends (
			store: StoreApi<S, Getters, Setters, ExtraMW>
		) => StoreApi<any, any, any, ExtraMW>,
	>(
		plugin: P
	): P extends (
		store: StoreApi<S, Getters, Setters, ExtraMW>
	) => StoreApi<infer S2, infer G2, infer A2, ExtraMW>
		? StoreApi<
				Override<S, S2>, // merge state
				Override<Getters, G2>, // merge getters (aware of new S)
				Override<Setters, A2>, // merge setters (aware of new S)
				ExtraMW // keep middleware slot
			>
		: never

	extendByState<NS extends State>(patch: NS): StoreApi<Override<S, NS>, Getters, Setters, ExtraMW>
	extendByState<NS extends State, Builder extends ByStateBuilder<NS, S, Getters>>(
		builder: Builder
	): StoreApi<Override<S, ReturnType<Builder>>, Getters, Setters, ExtraMW>

	extendGetters<Builder extends GettersBuilder<S, Getters>>(
		builder: Builder
	): StoreApi<S, Override<Getters, ReturnType<Builder>>, Setters, ExtraMW>

	extendSetters<Builder extends SettersBuilder<S, Getters, Setters>>(
		builder: Builder
	): StoreApi<S, Getters, Override<Setters, ReturnType<Builder>>, ExtraMW>

	restrictState(): StoreApiEncapsulated<S, Getters, Setters, ExtraMW>
	restrictState<Key extends keyof S>(
		publicState: Key[]
	): StoreApiEncapsulated<Omit<S, Key>, Getters, Setters, ExtraMW>
}

export type GettersBuilder<S extends State, Getters> = (args: {
	get: OverrideGet<GetRecord<S>, Getters, S>
}) => Record<string, (...args: any[]) => any>

export type SettersBuilder<S extends State, Getters = {}, Setters = {}> = (args: {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'>
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
}) => Record<string, (...args: any[]) => void>

export type ByStateBuilder<NS extends State, S extends State, Getters = {}> = (args: {
	get: OverrideGet<GetRecord<S>, Getters, S>
}) => NS

export type GetRecordBase<S extends Record<string, any>> = () => S
export type GetRecord<S extends Record<string, any>> = GetRecordBase<S>

export type SetRecordBase<S extends Record<string, any>> = StoreApiLib<S>['setState']
export type SetRecord<S extends Record<string, any>> = SetRecordBase<S> & {
	[K in keyof S]-?: (value: S[K]) => void
}

export type UseRecordBase<S> = {
	// 1) Array of keys -> Pick<S, K>
	<K extends readonly (keyof S)[]>(
		selector: K,
		equality?: EqualityChecker<Pick<S, K[number]>>
	): Pick<S, K[number]>

	// 2) Selector function -> R
	<R>(selector: (state: S) => R, equality?: EqualityChecker<R>): R

	// 3) No selector -> whole state
	(selector?: undefined, equality?: EqualityChecker<S>): S
}
export type UseRecord<S> = UseRecordDeep<S> & UseRecordBase<S>

type UseRecordDeep<S> = {
	[K in keyof S]-?: S[K] extends Record<string, any>
		? IsOptional<S, K> extends false
			? ((equalityFn?: EqualityChecker<S[K]>) => S[K]) & UseRecordDeep<S[K]>
			: never
		: (equalityFn?: EqualityChecker<S[K]>) => S[K]
}

type IsOptional<S, K extends keyof S> =
	// 1. Check if undefined is assignable to the type
	undefined extends S[K]
		? // 2. Check if removing that key doesn't break assignability
			{} extends Pick<S, K>
			? true // It's optional
			: false
		: false

export type MWConfiguration = {
	devtools?: true | Omit<DevtoolsOptions, 'store'>
	persist?: true | Omit<PersistOptions<any>, 'name'>
}

// Partially took from zustand.
export type StorePersist<S> = {
	persist: {
		clearStorage: () => void
		getOptions: () => Partial<PersistOptions<S, S>>
		hasHydrated: () => boolean
		onFinishHydration: (fn: (state: S) => void) => () => void
		onHydrate: (fn: (state: S) => void) => () => void
		read: () => S | undefined
		rehydrate: () => Promise<void> | void
		setOptions: (options: Partial<PersistOptions<S, S>>) => void
	}
}

export type GlobalConfig = { appName: string; logging: boolean }

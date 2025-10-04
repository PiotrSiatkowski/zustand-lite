/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-empty-object-type: 0 */
import { StoreApi as StoreApiLib } from 'zustand'
import { DevtoolsOptions, PersistOptions } from 'zustand/middleware'

export type State = Record<string | symbol, unknown>
export type Empty = Record<string, never>
export type Default = Record<string | symbol, any>
export type EqualityChecker<S> = (state: S, newState: S) => boolean

type Override<T, U> = Omit<T, keyof U> & U
type OverrideGet<T, U, S extends Record<string, any>> = Override<T, U> & GetRecordBase<S>
type OverrideSet<T, U, S extends Record<string, any>> = Override<T, U> & SetRecordBase<S>
type OverrideUse<T, U, S extends Record<string, any>> = Override<T, U> & UseRecordBase<S>

export type StoreApiEncapsulated<
	S extends State = Empty,
	Getters = Default,
	Setters = Default,
	ExtraMW = {},
> = {
	api: StoreApiLib<S> & ExtraMW
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
	use: OverrideUse<UseRecord<S>, Getters, S>
}

export type StoreApi<
	S extends State = Empty,
	Getters = Default,
	Setters = Default,
	ExtraMW = {},
> = {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'> & ExtraMW
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
	use: OverrideUse<UseRecord<S>, Getters, S>

	extendGetters<Builder extends GettersBuilder<S, Getters>>(
		builder: Builder
	): StoreApi<S, OverrideGet<Getters, ReturnType<Builder>, S>, Setters, ExtraMW>

	extendSetters<Builder extends SettersBuilder<S, Getters, Setters>>(
		builder: Builder
	): StoreApi<S, Getters, OverrideSet<Setters, ReturnType<Builder>, S>, ExtraMW>

	restrictState(): StoreApiEncapsulated<S, Getters, Setters, ExtraMW>
	restrictState<Key extends keyof S>(
		publicState: Key[]
	): StoreApiEncapsulated<Omit<S, Key>, Getters, Setters, ExtraMW>
}

export type GettersBuilder<S extends State, Getters = Default> = (args: {
	get: OverrideGet<GetRecord<S>, Getters, S>
}) => Record<string, (...args: any[]) => any>

export type SettersBuilder<S extends State, Getters = Default, Setters = Default> = (args: {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'>
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
}) => Record<string, (...args: any[]) => void>

export type GetRecordBase<S extends Record<string, any>> = () => S
export type GetRecord<S extends Record<string, any>> = GetRecordBase<S>

export type SetRecordBase<S extends Record<string, any>> = StoreApiLib<S>['setState']
export type SetRecord<S extends Record<string, any>> = SetRecordBase<S> & {
	[K in keyof S]-?: (value: S[K]) => void
}

export type UseRecordBase<S> = <R>(selector: (state: S) => R, equality?: EqualityChecker<R>) => R
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

export type StoreApiPlugin<
	NewApiData extends State,
	NewGetters,
	NewSetters,
	NewExtraMW = Default,
> = {
	creates?: () => NewApiData
	extends?: (
		store: StoreApi<NewApiData, NewGetters, NewSetters, NewExtraMW>
	) => StoreApi<NewApiData, NewGetters, NewSetters, NewExtraMW>
}

export type StoreApiPluginList = StoreApiPlugin<any, any, any, any>[]

export type AugmentedApiData<S, Plugins extends StoreApiPluginList> = S &
	UnionToIntersection<ExtractPluginTypes<Plugins, 'create'>[number]>

export type AugmentedGetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
	ExtractPluginTypes<Plugins, 'extend'>[number]['getters']
>

export type AugmentedSetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
	ExtractPluginTypes<Plugins, 'extend'>[number]['setters']
>

type UnionToIntersection<S> = (S extends any ? (k: S) => void : never) extends (k: infer I) => void
	? I
	: never

type ExtractPluginTypes<Plugins extends StoreApiPluginList, Key extends 'create' | 'extend'> = {
	[K in keyof Plugins]: Plugins[K] extends StoreApiPlugin<infer S, infer G, infer A>
		? Key extends 'create'
			? S
			: Key extends 'extend'
				? { getters: G; setters: A }
				: never
		: never
}

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

export type GlobalConfig = { appName: string; devtools: boolean }

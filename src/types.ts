import { StoreApi as StoreApiLib } from 'zustand'

export type State = Record<string | symbol, unknown>
export type Empty = Record<string, never>
export type Default = Record<string | symbol, any>
export type EqualityChecker<S> = (state: S, newState: S) => boolean

export type StoreApiEncapsulated<S extends State = Empty, Getters = Default, Setters = Default> = {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'>
	get: GetRecord<S> & Getters
	set: SetRecord<S> & Setters
	use: UseRecord<S> & Getters
}

export type StoreApi<S extends State = Empty, Getters = Default, Setters = Default> = {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'>
	get: GetRecord<S> & Getters
	set: SetRecord<S> & Setters
	use: UseRecord<S> & Getters

	extendGetters<Builder extends GettersBuilder<S, Getters>>(
		builder: Builder
	): StoreApi<S, Getters & ReturnType<Builder>, Setters>

	extendSetters<Builder extends SettersBuilder<S, Getters, Setters>>(
		builder: Builder
	): StoreApi<S, Getters, Setters & ReturnType<Builder>>

	restrictState(): StoreApiEncapsulated<S, Getters, Setters>
	restrictState<Key extends keyof S>(
		publicState: Key[]
	): StoreApiEncapsulated<Omit<S, Key>, Getters, Setters>
}

export type GettersBuilder<S extends State, Getters = Default> = (args: {
	get: GetRecord<S> & Getters
}) => Record<string, (...args: any[]) => any>

export type SettersBuilder<S extends State, Getters = Default, Setters = Default> = (args: {
	api: Omit<StoreApiLib<S>, 'setState' | 'getState'>
	get: GetRecord<S> & Getters
	set: SetRecord<S> & Setters
}) => Record<string, (...args: any[]) => void>

export type GetRecord<S extends Record<string, any>> = () => S
export type SetRecord<S extends Record<string, any>> = StoreApiLib<S>['setState'] & {
	[K in keyof S]-?: (value: S[K]) => void
}
export type UseRecord<S, R = any> = UseRecordDeep<S> &
	((selector: (state: S) => R, equality?: EqualityChecker<S>) => R)

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

export type StoreApiPlugin<NewApiData extends State, NewGetters, NewSetters> = {
	creates?: () => NewApiData
	extends?: (
		store: StoreApi<NewApiData, NewGetters, NewSetters>
	) => StoreApi<NewApiData, NewGetters, NewSetters>
}

export type StoreApiPluginList = StoreApiPlugin<any, any, any>[]

export type AugmentedApiData<S, Plugins extends StoreApiPluginList> = S &
	UnionToIntersection<ExtractPluginTypes<Plugins, 'create'>[number]>

export type AugmentedGetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
	ExtractPluginTypes<Plugins, 'extend'>[number]['getters']
>

export type AugmentedSetters<Plugins extends StoreApiPluginList> = UnionToIntersection<
	ExtractPluginTypes<Plugins, 'extend'>[number]['setters']
>

type ExtractPluginTypes<Plugins extends StoreApiPluginList, Key extends 'create' | 'extend'> = {
	[K in keyof Plugins]: Plugins[K] extends StoreApiPlugin<infer S, infer G, infer A>
		? Key extends 'create'
			? S
			: Key extends 'extend'
				? { getters: G; setters: A }
				: never
		: never
}

type UnionToIntersection<S> = (S extends any ? (k: S) => void : never) extends (k: infer I) => void
	? I
	: never

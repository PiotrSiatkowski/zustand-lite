/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-empty-object-type: 0 */
import { StoreApi as StoreApiLib } from 'zustand'
import { DevtoolsOptions, PersistOptions } from 'zustand/middleware'

export type State = Record<PropertyKey, unknown>
export type EqualityChecker<S> = (state: S, newState: S) => boolean

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
export type Override<T, U> = Prettify<Omit<T, keyof U> & U>
export type Augments<T, U, Base> = Base & Override<T, U>
export type StoreLib<S> = Omit<StoreApiLib<S>, 'setState' | 'getState'>

export type GetBase<S extends State> = () => Readonly<S>
export type SetBase<S extends State> = StoreApiLib<S>['setState']
export type UseBase<S extends State> = UseRecordBase<S>

export type OverrideGet<T, U, S extends State> = Augments<T, U, GetBase<S>>
export type OverrideSet<T, U, S extends State> = Augments<T, U, SetBase<S>>
export type OverrideUse<T, U, S extends State> = Augments<T, GettersWithEquality<U>, UseBase<S>>

export type GetRecord<S extends Record<string, unknown>> = GetBase<S>
export type SetRecord<S extends Record<string, unknown>> = SetBase<S> & {
	[K in keyof S]-?: (value: S[K]) => any
}

export type StoreApiEncapsulated<S extends State = {}, Getters = {}, Setters = {}, ExtraMW = {}> = {
	api: StoreApiLib<S> & ExtraMW
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
	use: OverrideUse<UseRecord<S>, Getters, S>
}

export type StoreApi<S extends State = {}, Getters = {}, Setters = {}, ExtraMW = {}> = {
	api: StoreLib<S> & ExtraMW
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

	extendByState<NS extends State>(
		patch: NoOverlappingKeys<S, NS>
	): StoreApi<S & NS, Getters, Setters, ExtraMW>
	extendByState<NS extends State, Builder extends ByStateBuilder<NS, S, Getters>>(
		builder: ByStateBuilder<NS, S, Getters>
	): StoreApi<S & ReturnType<Builder>, Getters, Setters, ExtraMW>

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
}) => Record<string, AnyFn>

export type SettersBuilder<S extends State, Getters = {}, Setters = {}> = (args: {
	api: StoreLib<S>
	get: OverrideGet<GetRecord<S>, Getters, S>
	set: OverrideSet<SetRecord<S>, Setters, S>
}) => Record<string, AnyFn>

export type ByStateBuilder<NS extends State, S extends State, Getters = {}> = (args: {
	get: OverrideGet<GetRecord<S>, Getters, S>
}) => NoOverlappingKeys<S, NS>

export type UseRecordBase<S> = {
	// 1) Array of keys -> Pick<S, K>
	<K extends readonly (keyof S)[]>(
		selector: K,
		equality?: EqualityChecker<Pick<S, K[number]>>
	): Readonly<Pick<S, K[number]>>

	// 2) Selector function -> R
	<R>(selector: (state: S) => R, equality?: EqualityChecker<R>): R

	// 3) No selector -> whole state
	(selector?: undefined, equality?: EqualityChecker<Readonly<S>>): Readonly<S>
}
export type UseRecord<S> = UseRecordDeep<S> & UseRecordBase<S>

type AnyFn = (...args: any[]) => any

/**
 * Options object for customizing getter hook behavior.
 * Pass this as the last argument to a custom getter hook.
 *
 * @example
 * ```ts
 * store.use.getItemById(id, { eq: (a, b) => a?.id === b?.id })
 * ```
 */
export type UseGetterOptions<R> = {
	eq: EqualityChecker<R>
}

/**
 * Transforms a getter function type to accept an optional equality options argument.
 * This allows passing `withEq(equalityFn)` as the last argument to custom getters.
 */
export type WithEqualityOption<F> = F extends (...args: infer A) => infer R
	? (...args: [...A, options?: UseGetterOptions<R>]) => R
	: F

/**
 * Transforms all getters in a record to accept optional equality options.
 */
export type GettersWithEquality<G> = {
	[K in keyof G]: WithEqualityOption<G[K]>
}

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

type NoOverlappingKeys<Old, New> = keyof Old & keyof New extends never ? New : never

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

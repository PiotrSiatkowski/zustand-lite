/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-empty-object-type: 0 */
import { Mutate, StoreApi as StoreApiLib } from 'zustand'
import { DevtoolsOptions, PersistOptions } from 'zustand/middleware'
import { getterOptionsMarker } from './utils/optionsMarker'

export type State = object
export type EqualityChecker<ValueType> = (firstValue: ValueType, otherValue: ValueType) => boolean

type AnyFn = (...callArgs: any[]) => any
type BoxedPrimitive =
	| (String & object)
	| (Number & object)
	| (Boolean & object)
	| (Symbol & object)
	| (BigInt & object)
type OpaqueObject =
	| AnyFn
	| BoxedPrimitive
	| Date
	| RegExp
	| ReadonlyMap<unknown, unknown>
	| ReadonlySet<unknown>
	| WeakMap<object, unknown>
	| WeakSet<object>
	| PromiseLike<unknown>
	| Error
	| ArrayBuffer
	| SharedArrayBuffer
	| ArrayBufferView

/**
 * Root state must be a record-like object that can be safely spread and extended.
 * Nested values may still contain arrays, functions, and opaque object instances.
 */
export type PlainState<StoreState extends State> = StoreState extends
	| readonly unknown[]
	| OpaqueObject
	? never
	: '__proto__' extends keyof StoreState
		? never
		: StoreState
type FunctionKeys<T> = { [K in keyof T]-?: T[K] extends AnyFn ? K : never }[keyof T]

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
export type Override<T, U> = Prettify<Omit<T, keyof U> & U>
export type Augments<T, U, Base> = Base & Override<T, U>
export type StoreLib<StoreState> = Omit<StoreApiLib<StoreState>, 'setState' | 'getState'>
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]

export type GetBase<StoreState extends State> = () => Readonly<StoreState>
export type SetBase<StoreState extends State> = StoreApiLib<StoreState>['setState']
export type UseBase<StoreState extends State> = UseRecordBase<StoreState>

export type OverrideGet<T, U, StoreState extends State> = Augments<T, U, GetBase<StoreState>>
export type OverrideSet<T, U, StoreState extends State> = Augments<T, U, SetBase<StoreState>>
export type OverrideUse<T, U, StoreState extends State> = Augments<
	T,
	GettersWithEquality<U>,
	UseBase<StoreState>
>

export type GetRecord<StoreState extends State> = GetBase<StoreState>
export type SetRecord<StoreState extends State> = SetBase<StoreState> & {
	[K in Extract<RequiredKeys<StoreState>, string | number>]-?: (value: StoreState[K]) => void
}

export type StoreApiEncapsulated<
	StoreState extends State = {},
	GetMethods = {},
	SetMethods = {},
	Middleware = {},
> = {
	api: StoreApiLib<StoreState> & StoreSubscribeWithSelector<StoreState> & Middleware
	get: OverrideGet<GetRecord<StoreState>, GetMethods, StoreState>
	set: OverrideSet<SetRecord<StoreState>, SetMethods, StoreState>
	use: OverrideUse<UseRecord<StoreState>, GetMethods, StoreState>
}

export type StoreApi<
	StoreState extends State = {},
	GetMethods = {},
	SetMethods = {},
	Middleware = {},
> = {
	api: StoreApiLib<StoreState> & StoreSubscribeWithSelector<StoreState> & Middleware
	get: OverrideGet<GetRecord<StoreState>, GetMethods, StoreState>
	set: OverrideSet<SetRecord<StoreState>, SetMethods, StoreState>
	use: OverrideUse<UseRecord<StoreState>, GetMethods, StoreState>

	// Plugin fields are merged onto the existing API, with existing state fields preserved.
	composePlugin<PluginState extends State, PluginGets, PluginSets>(
		plugin: DefinedPlugin<PluginState, PluginGets, PluginSets>
	): StoreApi<
		Override<PluginState, StoreState>,
		Override<GetMethods, PluginGets>,
		Override<SetMethods, PluginSets>,
		Middleware
	>

	extendByState<AddedState extends State>(
		patch: PlainState<AddedState> & NoOverlappingKeys<StoreState, AddedState>
	): StoreApi<StoreState & AddedState, GetMethods, SetMethods, Middleware>
	extendByState<
		AddedState extends State,
		AddBuilder extends ByStateBuilder<AddedState, StoreState, GetMethods>,
	>(
		builder: ByStateBuilder<AddedState, StoreState, GetMethods>
	): StoreApi<StoreState & ReturnType<AddBuilder>, GetMethods, SetMethods, Middleware>

	extendGetters<GetBuilder extends GettersBuilder<StoreState, GetMethods>>(
		builder: GetBuilder
	): StoreApi<StoreState, Override<GetMethods, ReturnType<GetBuilder>>, SetMethods, Middleware>

	extendSetters<SetBuilder extends SettersBuilder<StoreState, GetMethods, SetMethods>>(
		builder: SetBuilder
	): StoreApi<StoreState, GetMethods, Override<SetMethods, ReturnType<SetBuilder>>, Middleware>

	restrictState(): StoreApiEncapsulated<StoreState, GetMethods, SetMethods, Middleware>
	restrictState<PrivateKey extends keyof StoreState>(
		privateKeys: PrivateKey[]
	): StoreApiEncapsulated<
		Omit<StoreState, NormalizedPropertyKey<PrivateKey>>,
		Omit<GetMethods, NormalizedPropertyKey<PrivateKey>>,
		Omit<SetMethods, NormalizedPropertyKey<PrivateKey>>,
		RebindMiddlewareState<
			Middleware,
			Omit<StoreState, NormalizedPropertyKey<PrivateKey>>,
			NormalizedPropertyKey<PrivateKey>
		>
	>
}

export type DefinedPlugin<PluginState extends State = {}, PluginGets = {}, PluginSets = {}> = {
	<StoreState extends State, GetMethods, SetMethods, Middleware>(
		store: StoreApi<StoreState, GetMethods, SetMethods, Middleware>
	): StoreApi<
		Override<PluginState, StoreState>,
		Override<GetMethods, PluginGets>,
		Override<SetMethods, PluginSets>,
		Middleware
	>
	readonly _types?: [PluginState, PluginGets, PluginSets]
}

export type GettersBuilder<StoreState extends State, GetMethods> = (args: {
	get: OverrideGet<GetRecord<StoreState>, GetMethods, StoreState>
}) => Record<string, AnyFn>

export type SettersBuilder<StoreState extends State, GetMethods = {}, SetMethods = {}> = (args: {
	api: StoreLib<StoreState>
	get: OverrideGet<GetRecord<StoreState>, GetMethods, StoreState>
	set: OverrideSet<SetRecord<StoreState>, SetMethods, StoreState>
}) => Record<string, AnyFn>

export type ByStateBuilder<
	AddedState extends State,
	StoreState extends State,
	GetMethods = {},
> = (args: {
	get: OverrideGet<GetRecord<StoreState>, GetMethods, StoreState>
}) => PlainState<AddedState> & NoOverlappingKeys<StoreState, AddedState>

export type UseRecordBase<StoreState> = {
	// An array selector returns the corresponding state subset.
	<K extends readonly (keyof StoreState)[]>(
		selector: K,
		equality?: EqualityChecker<Pick<StoreState, K[number]>>
	): Readonly<Pick<StoreState, K[number]>>

	// A selector function returns its inferred result.
	<R>(selector: (state: StoreState) => R, equality?: EqualityChecker<R>): R

	// Omitting a selector returns the complete state.
	(selector?: undefined, equality?: EqualityChecker<Readonly<StoreState>>): Readonly<StoreState>
}
export type UseRecord<StoreState> = UseRecordDeep<StoreState> & UseRecordBase<StoreState>

/**
 * Input accepted by `withOptions` when configuring a custom getter hook.
 * Pass the branded value returned by `withOptions` to the hook.
 *
 * @example
 * ```ts
 * store.use.getItemById(id, withOptions({ eq: (a, b) => a?.id === b?.id }))
 * ```
 */
export type UseGetterOptions<R> = { eq: EqualityChecker<R> }
export type BrandedUseGetterOptions<R> = UseGetterOptions<R> & {
	readonly [getterOptionsMarker]: true
}

/**
 * Transforms a getter function type to accept an optional equality options argument.
 * This allows passing `withOptions(options)` as the last argument to custom getters.
 */
export type WithEqualityOption<F> = F extends (...args: infer A) => infer R
	? (...args: [...A, options?: BrandedUseGetterOptions<R>]) => R
	: F

/**
 * Transforms all getters in a record to accept optional equality options.
 */
export type GettersWithEquality<G> = { [K in keyof G]: WithEqualityOption<G[K]> }

type UseRecordDeep<StoreState> = {
	[K in Extract<
		RequiredKeys<StoreState>,
		string | number
	>]-?: StoreState[K] extends readonly any[]
		? (equalityFn?: EqualityChecker<StoreState[K]>) => StoreState[K]
		: StoreState[K] extends OpaqueObject
			? (equalityFn?: EqualityChecker<StoreState[K]>) => StoreState[K]
			: StoreState[K] extends object
				? [FunctionKeys<StoreState[K]>] extends [never]
					? ((equalityFn?: EqualityChecker<StoreState[K]>) => StoreState[K]) &
							UseRecordDeep<StoreState[K]>
					: (equalityFn?: EqualityChecker<StoreState[K]>) => StoreState[K]
				: (equalityFn?: EqualityChecker<StoreState[K]>) => StoreState[K]
}

type NoOverlappingKeys<Old, New> = keyof Old & keyof New extends never ? New : never

export type MWConfiguration<StoreState extends State = State> = {
	devtools?: boolean | Omit<DevtoolsOptions, 'store'>
	persist?: boolean | Omit<PersistOptions<StoreState, any, any>, 'name'>
}

/**
 * Public subset of Zustand's persist API, plus the unwrapped `read` convenience method.
 */
export type StorePersist<StoreState, PersistedState = StoreState> = {
	persist: {
		clearStorage: () => void
		getOptions: () => Partial<PersistOptions<StoreState, PersistedState, unknown>>
		hasHydrated: () => boolean
		onFinishHydration: (listener: (state: StoreState) => void) => () => void
		onHydrate: (listener: (state: StoreState) => void) => () => void
		read: () => PersistedState | undefined | Promise<PersistedState | undefined>
		rehydrate: () => Promise<void> | void
		setOptions: (options: Partial<PersistOptions<StoreState, PersistedState, unknown>>) => void
	}
}

export type PersistedStateFor<StoreState, Middleware> = Middleware extends {
	persist: infer Persist
}
	? Persist extends { partialize: (...args: any[]) => infer PersistedState }
		? PersistedState
		: Persist extends Omit<PersistOptions<StoreState, infer PersistedState, any>, 'name'>
			? PersistedState
			: StoreState
	: StoreState

type RebindMiddlewareState<Middleware, StoreState, PrivateKey extends PropertyKey> =
	Middleware extends StorePersist<any, infer PersistedState>
		? Omit<Middleware, 'persist'> &
				StorePersist<StoreState, OmitPrivateKeys<PersistedState, PrivateKey>>
		: Middleware

type OmitPrivateKeys<PersistedState, PrivateKey extends PropertyKey> = PersistedState extends State
	? Omit<PersistedState, Extract<keyof PersistedState, PrivateKey>>
	: PersistedState

type NormalizedPropertyKey<Key extends PropertyKey> =
	| Key
	| (Key extends number
			? `${Key}`
			: Key extends `${infer NumericKey extends number}`
				? NumericKey
				: never)

export type StoreSubscribeWithSelector<StoreState> = Pick<
	Mutate<StoreApiLib<StoreState>, [['zustand/subscribeWithSelector', never]]>,
	'subscribe'
>

export type GlobalConfig = { appName: string; logging: boolean }

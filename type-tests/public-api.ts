import { createStore, definePlugin, withOptions, withReset } from '../src'
import type { PersistOptions } from 'zustand/middleware'

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

const base = createStore({ count: 0 }).extendGetters(() => ({ double: () => 2 }))
const resettable = withReset(base)

interface InterfaceState {
	count: number
	label: string
}
const interfaceStore = createStore<InterfaceState>({ count: 0, label: 'initial' })
interfaceStore.set.count(1)
interfaceStore.use.label
// @ts-expect-error Store state must be an object, not a function.
createStore(() => 1)
// @ts-expect-error Root arrays are values, not state records.
createStore([1, 2])
// @ts-expect-error Built-in opaque objects are not state records.
createStore(new Date())
// @ts-expect-error Errors are values, not state records.
createStore(new Error('invalid'))
// @ts-expect-error Typed arrays are values, not state records.
createStore(new Uint8Array())
// @ts-expect-error Extensions must be state records.
createStore({ value: 1 }).extendByState([2, 3])
// @ts-expect-error Prototype-mutating keys are not valid state fields.
createStore({ ['__proto__']: 1 })
// @ts-expect-error Prototype-mutating keys are not valid extension fields.
createStore({ value: 1 }).extendByState({ ['__proto__']: 1 })

resettable.get().count
resettable.get.double()
resettable.set.count(1)
resettable.set.reset()

const store = createStore({ count: 0 })

store.api.getState().count
store.api.setState({ count: 1 })

const reservedNames = createStore({ name: 'before', length: 1 })
reservedNames.set.name('after')
reservedNames.set.length(2)
reservedNames.use.name()
reservedNames.use.length()

const arrays = createStore({ items: [{ value: 1 }] })
arrays.use.items()
type ArraysDoNotExposeIndices = Expect<
	Equal<number extends keyof typeof arrays.use.items ? true : false, false>
>

const opaque = createStore({
	createdAt: new Date(),
	error: new Error('failure'),
	index: new Map<string, number>(),
	bytes: new Uint8Array(),
})
opaque.use.createdAt()
opaque.use.error()
opaque.use.index()
opaque.use.bytes()
type DateDoesNotExposeDeepHooks = Expect<
	Equal<'getTime' extends keyof typeof opaque.use.createdAt ? true : false, false>
>
type MapDoesNotExposeDeepHooks = Expect<
	Equal<'get' extends keyof typeof opaque.use.index ? true : false, false>
>
type ErrorDoesNotExposeDeepHooks = Expect<
	Equal<'message' extends keyof typeof opaque.use.error ? true : false, false>
>
type TypedArrayDoesNotExposeDeepHooks = Expect<
	Equal<number extends keyof typeof opaque.use.bytes ? true : false, false>
>

class Model {
	value = 1
	method() {
		return this.value
	}
}
const classValue = createStore({ model: new Model() })
classValue.use.model()
type ClassDoesNotExposeDeepHooks = Expect<
	Equal<'method' extends keyof typeof classValue.use.model ? true : false, false>
>

const optional = createStore({ required: 1 } as { required: number; optional?: number })
type OptionalUseIsOmitted = Expect<
	Equal<'optional' extends keyof typeof optional.use ? true : false, false>
>
type OptionalSetterIsOmitted = Expect<
	Equal<'optional' extends keyof typeof optional.set ? true : false, false>
>

createStore(
	{ count: 0 },
	{
		middlewares: {
			persist: {
				partialize: (state) => {
					type PersistStateIsInferred = Expect<Equal<typeof state, { count: number }>>
					const assertion: PersistStateIsInferred = true
					return assertion ? { count: state.count } : state
				},
			},
		},
	}
)

const partiallyPersisted = createStore(
	{ saved: 1, transient: '' },
	{ middlewares: { persist: { partialize: (state) => ({ saved: state.saved }) } } }
)
type PartiallyPersistedRead = Awaited<ReturnType<typeof partiallyPersisted.api.persist.read>>
type PersistReadMatchesPartialize = Expect<
	Equal<PartiallyPersistedRead, { saved: number } | undefined>
>

const reusablePersistOptions: Omit<
	PersistOptions<{ saved: number; transient: string }, { saved: number }>,
	'name'
> = { partialize: (state) => ({ saved: state.saved }) }
const reusablePartialPersist = createStore(
	{ saved: 1, transient: '' },
	{ middlewares: { persist: reusablePersistOptions } }
)
type ReusablePersistReadMatchesOptions = Expect<
	Equal<
		Awaited<ReturnType<typeof reusablePartialPersist.api.persist.read>>,
		{ saved: number } | undefined
	>
>

const noPersist = createStore({ count: 0 }, { middlewares: { persist: undefined } })
// @ts-expect-error Disabled persistence must not expose the persist API.
noPersist.api.persist

const disabledPersist = createStore({ count: 0 }, { middlewares: { persist: false } })
// @ts-expect-error Disabled persistence must not expose the persist API.
disabledPersist.api.persist

const middlewareFromHelper = { persist: true }
createStore({ count: 0 }, { middlewares: middlewareFromHelper })

createStore(
	{ count: 0 },
	{
		middlewares: {
			// @ts-expect-error Unknown middleware keys must be rejected.
			persit: true,
		},
	}
)

const typedPlugin = definePlugin((store) =>
	store
		.extendGetters(() => ({ answer: () => 42 }))
		.extendSetters(() => ({ describe: () => 'value' }))
)
const pluginStore = createStore({ count: 0 }).composePlugin(typedPlugin)
const answer: number = pluginStore.get.answer()
const description: string = pluginStore.set.describe()

const equalityStore = createStore({ value: 1 }).extendGetters(() => ({
	isEqual: (expected: number) => expected === 1,
}))
equalityStore.use.isEqual(1, withOptions({ eq: Object.is }))
// @ts-expect-error Equality options must be created with withOptions.
equalityStore.use.isEqual(1, { eq: Object.is })

const restricted = createStore({ visible: 1, secret: 2 }).restrictState(['secret'])
restricted.api.subscribe(
	(state) => {
		// @ts-expect-error Restricted state must not expose private keys.
		state.secret
		return state.visible
	},
	() => undefined
)
// @ts-expect-error Restricted raw state must not expose private keys.
restricted.api.getState().secret

const restrictedPersist = createStore(
	{ visible: 1, secret: 2 },
	{ middlewares: { persist: true } }
).restrictState(['secret'])
restrictedPersist.api.persist.onHydrate((state) => {
	state.visible
	// @ts-expect-error Persist callbacks must not expose restricted keys.
	state.secret
})
type RestrictedPersistedState = Awaited<ReturnType<typeof restrictedPersist.api.persist.read>>
type RestrictedPersistReadIsPublic = Expect<
	Equal<RestrictedPersistedState, { visible: number } | undefined>
>

const restrictedCollisions = createStore({ visible: 1, secret: 2 })
	.extendGetters(() => ({ secret: () => 'derived' }))
	.extendSetters(() => ({ secret: () => 'action' }))
	.restrictState(['secret'])
// @ts-expect-error A getter colliding with a private key is removed.
restrictedCollisions.get.secret
// @ts-expect-error A hook colliding with a private key is removed.
restrictedCollisions.use.secret
// @ts-expect-error A setter colliding with a private key is removed.
restrictedCollisions.set.secret

const numericRestricted = createStore({ 0: 'secret', visible: 1 }).restrictState([0])
type NumericPrivateKeyIsOmitted = Expect<
	Equal<0 extends keyof ReturnType<typeof numericRestricted.get> ? true : false, false>
>

type Store = ReturnType<typeof createStore<{ count: number }>>

type FieldSettersReturnVoid = Expect<Equal<ReturnType<Store['set']['count']>, void>>

export type PublicApiAssertions =
	| FieldSettersReturnVoid
	| ArraysDoNotExposeIndices
	| DateDoesNotExposeDeepHooks
	| MapDoesNotExposeDeepHooks
	| ErrorDoesNotExposeDeepHooks
	| TypedArrayDoesNotExposeDeepHooks
	| ClassDoesNotExposeDeepHooks
	| OptionalUseIsOmitted
	| OptionalSetterIsOmitted
	| PersistReadMatchesPartialize
	| ReusablePersistReadMatchesOptions
	| RestrictedPersistReadIsPublic
	| NumericPrivateKeyIsOmitted

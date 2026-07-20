import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { runInNewContext } from 'node:vm'
import { createJSONStorage } from 'zustand/middleware'

import { createStore, setGlobalConfig } from './lib/createStore'
import { withReset } from './plugins/reset'

describe('Regression coverage', () => {
	beforeEach(() => {
		localStorage.clear()
		sessionStorage.clear()
		setGlobalConfig({ appName: 'zustand-lite', logging: false })
	})

	test('restrictState hides falsy values', () => {
		const store = createStore({
			zero: 0,
			empty: '',
			disabled: false,
			nothing: null,
			visible: 1,
		}).restrictState(['zero', 'empty', 'disabled', 'nothing'])

		expect(store.get()).toEqual({ visible: 1 })
		expect(Object.keys(store.use)).not.toEqual(
			expect.arrayContaining(['zero', 'empty', 'disabled', 'nothing'])
		)
	})

	test('restrictState hides fields added by extendByState', () => {
		const store = createStore({ visible: 1 })
			.extendByState({ secret: 2 })
			.restrictState(['secret'])

		expect(store.get()).toEqual({ visible: 1 })
		expect((store.use as any).secret).toBeUndefined()
	})

	test('restrictState protects hidden fields across the complete public API', () => {
		const store = createStore({ visible: 1, secret: 2 })
			.extendGetters(({ get }) => ({ getSecret: () => get().secret }))
			.restrictState(['secret'])
		const publicStore = store as any

		expect(publicStore.api.getState()).toEqual({ visible: 1 })
		expect(publicStore.set.secret).toBeUndefined()

		publicStore.set({ secret: 3 })

		expect(store.get.getSecret()).toBe(2)
	})

	test('restrictState prevents selector hooks from reading hidden fields', () => {
		const store = createStore({ visible: 1, secret: 2 }).restrictState(['secret'])

		function Component() {
			const secret = (store.use as any)((state: any) => state.secret)
			return <div>Secret: {String(secret)}</div>
		}

		render(<Component />)
		screen.getByText('Secret: undefined')
	})

	test('restricted subscribers ignore private-only updates', () => {
		const store = createStore({ visible: 1, secret: 2 })
			.extendSetters(({ get, set }) => ({ updateSecret: () => set.secret(get().secret + 1) }))
			.restrictState(['secret'])
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set.updateSecret()

		expect(listener).not.toHaveBeenCalled()
		unsubscribe()
	})

	test('persist uses a stable normalized storage key', () => {
		setGlobalConfig({ appName: 'My App Name' })
		const store = createStore({ value: 1 }, { name: 'Example', middlewares: { persist: true } })

		expect(store.api.persist.getOptions().name).toBe('My-App-Name.Example')
	})

	test('persist.read uses configured custom storage', () => {
		const store = createStore(
			{ value: 1 },
			{
				name: 'CustomStorage',
				middlewares: { persist: { storage: createJSONStorage(() => sessionStorage) } },
			}
		)

		store.set.value(2)

		expect(store.api.persist.read()).toEqual({ value: 2 })
	})

	test('persist.read follows storage key changes', () => {
		const store = createStore(
			{ value: 1 },
			{ name: 'Original', middlewares: { persist: true } }
		)

		store.api.persist.setOptions({ name: 'Changed' })
		store.set.value(2)

		expect(store.api.persist.read()).toEqual({ value: 2 })
	})

	test('restricted persist.read hides private state', () => {
		const store = createStore(
			{ visible: 1, secret: 2 },
			{ middlewares: { persist: true } }
		).restrictState(['secret'])

		store.set.visible(3)

		expect(store.api.persist.read()).toEqual({ visible: 3 })
		const key = store.api.persist.getOptions().name!
		expect(JSON.parse(localStorage.getItem(key)!).state).toEqual({ visible: 3, secret: 2 })
	})

	test('restricted hydration callbacks receive only public state', async () => {
		const name = 'zustand-lite.Hydration'
		localStorage.setItem(name, JSON.stringify({ state: { visible: 5, secret: 7 }, version: 0 }))
		const store = createStore(
			{ visible: 1, secret: 2 },
			{ name: 'Hydration', middlewares: { persist: { skipHydration: true } } }
		).restrictState(['secret'])
		const onHydrate = jest.fn()
		const onFinishHydration = jest.fn()

		store.api.persist.onHydrate(onHydrate)
		store.api.persist.onFinishHydration(onFinishHydration)
		await store.api.persist.rehydrate()

		expect(onHydrate).toHaveBeenCalledWith({ visible: 1 })
		expect(onFinishHydration).toHaveBeenCalledWith({ visible: 5 })
		expect(store.get()).toEqual({ visible: 5 })
	})

	test('persist: undefined does not expose a runtime persist API', () => {
		const store = createStore({ value: 1 }, { middlewares: { persist: undefined } })

		expect(store.api).not.toHaveProperty('persist')
	})

	test('persist.read returns undefined when storage fails', async () => {
		let failure: 'none' | 'sync' | 'async' = 'none'
		const storage = {
			getItem: (): any => {
				if (failure === 'sync') {
					throw new Error('storage unavailable')
				}
				if (failure === 'async') {
					return Promise.reject(new Error('storage unavailable'))
				}
				return null
			},
			setItem: () => undefined,
			removeItem: () => undefined,
		}
		const store = createStore({ value: 1 }, { middlewares: { persist: { storage } } })

		failure = 'sync'
		expect(store.api.persist.read()).toBeUndefined()

		failure = 'async'
		await expect(store.api.persist.read()).resolves.toBeUndefined()
	})

	test('reset restores fields added by extendByState', () => {
		const store = createStore({ count: 1 }).composePlugin(withReset).extendByState({ extra: 2 })

		expect(store.api.getInitialState()).toEqual({ count: 1, extra: 2 })

		store.set.count(3)
		store.set.extra(4)
		store.set.reset()

		expect(store.get()).toEqual({ count: 1, extra: 2 })
	})

	test('partial updates with unchanged values do not notify subscribers', () => {
		const store = createStore({ count: 1, label: 'one' })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set({ count: 1 })

		expect(listener).not.toHaveBeenCalled()
		unsubscribe()
	})

	test('partial updates use field-level shallow equality for nested values', () => {
		const store = createStore({ nested: { value: 1 }, items: [1, 2] })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set({ nested: { value: 1 } })
		store.set({ items: [1, 2] })

		expect(listener).not.toHaveBeenCalled()
		unsubscribe()
	})

	test('functional partial updates use field-level shallow equality', () => {
		const store = createStore({ nested: { value: 1 } })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set((state) => ({ nested: { value: state.nested.value } }))

		expect(listener).not.toHaveBeenCalled()
		unsubscribe()
	})

	test('raw api.setState preserves Zustand notification semantics', () => {
		const store = createStore({ value: 1 })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.api.setState({ value: 1 })

		expect(listener).toHaveBeenCalledTimes(1)
		unsubscribe()
	})

	test('arrays are treated as leaf values instead of generated deep paths', () => {
		const store = createStore({ items: [{ value: 1 }] })

		expect((store.use.items as any)[0]).toBeUndefined()
	})

	test('getter arguments containing an eq function are not mistaken for hook options', () => {
		const store = createStore({ value: 1 }).extendGetters(() => ({
			describe: (input: { eq: (a: number, b: number) => boolean; label: string }) =>
				input.label,
		}))

		function Component() {
			const label = store.use.describe({ eq: Object.is, label: 'business argument' })
			return <div>{label}</div>
		}

		render(<Component />)
		screen.getByText('business argument')
	})

	test('deep hooks return undefined when an intermediate object disappears', () => {
		const store = createStore({ nested: { value: 1 } })

		function Component() {
			return <div>Value: {String(store.use.nested.value())}</div>
		}

		render(<Component />)
		screen.getByText('Value: 1')

		act(() => store.set.nested(0 as never))

		screen.getByText('Value: undefined')
	})

	test('distinct opaque objects are not treated as shallow-equal updates', () => {
		const store = createStore({ createdAt: new Date(0), pattern: /before/ })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set.createdAt(new Date(1))
		store.set({ pattern: /after/ })

		expect(store.get().createdAt.getTime()).toBe(1)
		expect(store.get().pattern.source).toBe('after')
		expect(listener).toHaveBeenCalledTimes(2)
		unsubscribe()
	})

	test('extendByState adds own keys whose value is undefined', () => {
		const store = createStore({ visible: 1 }).extendByState({ missing: undefined })

		expect(Object.prototype.hasOwnProperty.call(store.get(), 'missing')).toBe(true)
		expect(store.get()).toEqual({ visible: 1, missing: undefined })
	})

	test('restrictState normalizes numeric private keys', () => {
		const store = createStore({ 0: 'secret', visible: 1 }).restrictState([0])

		expect(store.get()).toEqual({ visible: 1 })
		expect((store.set as any)[0]).toBeUndefined()
		expect((store.use as any)[0]).toBeUndefined()
	})

	test('restricted stores preserve public symbols and hide private symbols', () => {
		const publicSymbol = Symbol('public')
		const privateSymbol = Symbol('private')
		const store = createStore({
			[publicSymbol]: 1,
			[privateSymbol]: 2,
			visible: true,
		}).restrictState([privateSymbol])
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)

		store.set({ [publicSymbol]: 3 })

		expect(store.get()[publicSymbol]).toBe(3)
		expect((store.get() as any)[privateSymbol]).toBeUndefined()
		expect(listener).toHaveBeenCalledTimes(1)
		unsubscribe()
	})

	test('getter arguments containing only an eq function remain business arguments', () => {
		const store = createStore({ value: 1 }).extendGetters(() => ({
			compare: (input: { eq: (a: number, b: number) => boolean }) => input.eq(1, 1),
		}))

		function Component() {
			return <div>Equal: {String(store.use.compare({ eq: Object.is }))}</div>
		}

		render(<Component />)
		screen.getByText('Equal: true')
	})

	test('persist.read supports PromiseLike storage results', async () => {
		const stored = { state: { value: 2 }, version: 0 }
		const storage = {
			getItem: () => ({ then: (resolve: (value: typeof stored) => void) => resolve(stored) }),
			setItem: () => undefined,
			removeItem: () => undefined,
		}
		const store = createStore(
			{ value: 1 },
			{ middlewares: { persist: { storage: storage as any, skipHydration: true } } }
		)

		await expect(store.api.persist.read()).resolves.toEqual({ value: 2 })
	})

	test('restrictState removes colliding custom APIs consistently', () => {
		const store = createStore({ secret: 1, visible: 2 })
			.extendGetters(() => ({ secret: () => 'derived' }))
			.extendSetters(() => ({ secret: () => 'action' }))
			.restrictState(['secret'])
		const publicStore = store as any

		expect(publicStore.get.secret).toBeUndefined()
		expect(publicStore.use.secret).toBeUndefined()
		expect(publicStore.set.secret).toBeUndefined()
	})

	test('default getter arguments shaped like equality options remain business arguments', () => {
		const fallback = { eq: () => false }
		const supplied = { eq: Object.is }
		const store = createStore({ value: 1 }).extendGetters(() => ({
			isSupplied: (input = fallback) => input === supplied,
		}))

		function Component() {
			return <div>Supplied: {String(store.use.isSupplied(supplied))}</div>
		}

		render(<Component />)
		screen.getByText('Supplied: true')
	})

	test('persist API remains available when default browser storage is unavailable', async () => {
		const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!
		Object.defineProperty(window, 'localStorage', {
			configurable: true,
			get: () => {
				throw new Error('storage unavailable')
			},
		})

		try {
			const store = createStore({ value: 1 }, { middlewares: { persist: true } })
			const onHydrate = jest.fn()
			const onFinishHydration = jest.fn()
			let stored: any
			const storage = {
				getItem: () => stored ?? null,
				setItem: (_name: string, value: any) => {
					stored = value
				},
				removeItem: () => {
					stored = undefined
				},
			}
			store.api.persist.onHydrate(onHydrate)
			store.api.persist.onFinishHydration(onFinishHydration)
			store.api.persist.setOptions({ storage })
			store.set.value(2)

			expect(store.api.persist.hasHydrated()).toBe(true)
			expect(store.api.persist.read()).toEqual({ value: 2 })
			stored = { state: { value: 3 }, version: 0 }
			await store.api.persist.rehydrate()
			expect(onHydrate).toHaveBeenCalledWith({ value: 2 })
			expect(onFinishHydration).toHaveBeenCalledWith({ value: 3 })
			expect(store.get()).toEqual({ value: 3 })
		} finally {
			Object.defineProperty(window, 'localStorage', descriptor)
		}
	})

	test('restricted persist options cannot observe private state', async () => {
		const store = createStore(
			{ visible: 1, secret: 2 },
			{ middlewares: { persist: true } }
		).restrictState(['secret'])
		const partialize = jest.fn((state: { visible: number }) => state)

		store.api.persist.setOptions({ partialize })
		store.set.visible(3)

		expect(partialize).toHaveBeenLastCalledWith({ visible: 3 })
		const options = store.api.persist.getOptions()
		const stored = await options.storage?.getItem(options.name!)
		expect(stored?.state).toEqual({ visible: 3 })
		expect(options.partialize).toBeUndefined()
	})

	test('incremental restricted persist options preserve the active partializer', () => {
		const initialStorage = {
			getItem: () => null,
			setItem: () => undefined,
			removeItem: () => undefined,
		}
		let stored: any
		const replacementStorage = {
			getItem: () => stored ?? null,
			setItem: (_name: string, value: any) => {
				stored = value
			},
			removeItem: () => undefined,
		}
		const store = createStore(
			{ visible: 1, secret: 2 },
			{ middlewares: { persist: { storage: initialStorage } } }
		).restrictState(['secret'])

		store.api.persist.setOptions({ partialize: (state) => ({ renamed: state.visible }) as any })
		store.api.persist.setOptions({ storage: replacementStorage })
		store.set.visible(3)

		expect(stored.state).toEqual({ renamed: 3 })
	})

	test('restricted persist.read filters cross-realm plain objects', () => {
		const crossRealmState = runInNewContext('({ visible: 1, secret: 2 })')
		const storage = {
			getItem: () => ({ state: crossRealmState, version: 0 }),
			setItem: () => undefined,
			removeItem: () => undefined,
		}
		const store = createStore(
			{ visible: 0, secret: 0 },
			{ middlewares: { persist: { storage, skipHydration: true } } }
		).restrictState(['secret'])

		expect(store.api.persist.read()).toEqual({ visible: 1 })
	})

	test('restricted persist.read preserves opaque partialized values', () => {
		let stored: any
		const storage = {
			getItem: () => stored,
			setItem: (_name: string, value: any) => {
				stored = value
			},
			removeItem: () => {
				stored = undefined
			},
		}
		const store = createStore(
			{ visible: 1, secret: 2 },
			{
				middlewares: {
					persist: { storage, partialize: () => new Date(123), skipHydration: true },
				},
			}
		).restrictState(['secret'])

		store.set.visible(2)

		expect(store.api.persist.read()).toEqual(new Date(123))
	})

	test('rejects non-plain root and extension state at runtime', () => {
		expect(() => (createStore as any)([1, 2])).toThrow('Initial state must be a plain object')
		expect(() => (createStore as any)(new Date())).toThrow(
			'Initial state must be a plain object'
		)
		expect(() => (createStore as any)(new Error('invalid'))).toThrow(
			'Initial state must be a plain object'
		)
		expect(() => (createStore({ value: 1 }).extendByState as any)([2, 3])).toThrow(
			'Extended state must be a plain object'
		)
		const unsafe = JSON.parse('{"__proto__":{"polluted":true}}')
		expect(() => (createStore as any)(unsafe)).toThrow(
			'Initial state cannot contain a "__proto__" key'
		)
		expect(() => (createStore({ value: 1 }).extendByState as any)(unsafe)).toThrow(
			'Extended state cannot contain a "__proto__" key'
		)
	})

	test('non-enumerable patches do not trigger ineffective updates', () => {
		const store = createStore({ value: 1 })
		const listener = jest.fn()
		const unsubscribe = store.api.subscribe(listener)
		const patch = Object.defineProperty({}, 'value', { value: 2, enumerable: false })

		store.set(patch)

		expect(store.get().value).toBe(1)
		expect(listener).not.toHaveBeenCalled()
		unsubscribe()
	})

	test('supports state and custom APIs named like function properties', () => {
		const store = createStore({ name: 'before', length: 1 })
			.extendGetters(() => ({ nameSummary: () => 'summary' }))
			.extendSetters(() => ({ lengthSummary: () => 'summary' }))

		store.set.name('after')
		store.set.length(2)

		expect(store.get()).toEqual({ name: 'after', length: 2 })
		expect(store.get.nameSummary()).toBe('summary')
		expect(store.set.lengthSummary()).toBe('summary')

		function Component() {
			return (
				<div>
					{store.use.name()}:{store.use.length()}
				</div>
			)
		}

		render(<Component />)
		screen.getByText('after:2')
	})

	test('supports custom getters and setters named name or length', () => {
		const store = createStore({ value: 1 })
			.extendGetters(() => ({ name: () => 'getter' }))
			.extendSetters(() => ({ length: () => 'setter' }))

		expect(store.get.name()).toBe('getter')
		expect(store.set.length()).toBe('setter')
	})

	test('treats nested class instances as hook leaves', () => {
		class Model {
			value = 1
			method() {
				return this.value
			}
		}
		const store = createStore({ model: new Model() })

		expect((store.use.model as any).value).toBeUndefined()
		expect((store.use.model as any).method).toBeUndefined()
	})
})

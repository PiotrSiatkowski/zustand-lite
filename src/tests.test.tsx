import React from 'react'
import { act, render, screen } from '@testing-library/react'

import { definePlugin } from './lib/definePlugin'
import { createStore } from './lib/createStore'

const renderProbe = jest.fn()

describe('Zustand Lite', () => {
	beforeEach(() => {
		renderProbe.mockClear()
	})

	test('Getter is not updated', () => {
		const store = createStore({ count: 0 })

		function Component() {
			return <div>Count: {store.get().count}</div>
		}

		render(<Component />)
		screen.getByText('Count: 0')
		act(() => store.set.count(1))
		screen.getByText('Count: 0')
		act(() => store.set.count(2))
		screen.getByText('Count: 0')
	})

	test('Getter is updated when component is re-rendered', () => {
		const store = createStore({ count: 0 })

		function Component() {
			return <div>Count: {store.get().count}</div>
		}

		const { rerender } = render(<Component />)
		screen.getByText('Count: 0')
		act(() => store.set.count(1))
		screen.getByText('Count: 0')
		act(() => store.set.count(2))
		screen.getByText('Count: 0')
		rerender(<Component />)
		screen.getByText('Count: 2')
	})

	test('Tracks getter when used as a hook', () => {
		const store = createStore({ count: 0 })

		function Component() {
			return <div>Count: {store.use.count()}</div>
		}

		render(<Component />)
		screen.getByText('Count: 0')
		act(() => store.set.count(1))
		screen.getByText('Count: 1')
		act(() => store.set.count(2))
		screen.getByText('Count: 2')
	})

	test('Uses custom setter to update value', () => {
		const store = createStore({ count: 0 }).extendSetters(({ get, set }) => ({
			increment() {
				set.count(get().count + 2)
			},
		}))

		function Component() {
			return <div>Count: {store.use.count()}</div>
		}

		render(<Component />)
		screen.getByText('Count: 0')
		act(() => store.set.increment())
		screen.getByText('Count: 2')
		act(() => store.set.increment())
		screen.getByText('Count: 4')
	})

	test('Does not track deeper value by default', () => {
		const store = createStore({ invoice: { price: 10 } }).extendSetters(({ get }) => ({
			increment() {
				get().invoice.price += 5
			},
		}))

		function Component() {
			return <div>Price: {store.use.invoice().price}</div>
		}

		render(<Component />)
		screen.getByText('Price: 10')
		act(() => store.set.increment())
		screen.getByText('Price: 10')
		act(() => store.set.increment())
		screen.getByText('Price: 10')
	})

	test('Tracks deeper value by default when value is set', () => {
		const store = createStore({ invoice: { price: 10 } }).extendSetters(({ get, set }) => ({
			increment() {
				set.invoice({ price: get().invoice.price + 5 })
			},
		}))

		function Component() {
			return <div>Price: {store.use.invoice().price}</div>
		}

		render(<Component />)
		screen.getByText('Price: 10')
		act(() => store.set.increment())
		screen.getByText('Price: 15')
		act(() => store.set.increment())
		screen.getByText('Price: 20')
	})

	test('Tracks deeper value by accident when another sub-property is set using shallow', () => {
		const store = createStore({ invoice: { price: 10, name: 'invoice' } }).extendSetters(
			({ get, set }) => ({
				changeName() {
					set.invoice({ name: 'changed', price: get().invoice.price })
				},
			})
		)

		function Component() {
			renderProbe()
			return <div>Price: {store.use.invoice().price}</div>
		}

		render(<Component />)
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changeName())
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(2)
		act(() => store.set.changeName())
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Tracks deeper value precisely when custom getter is used', () => {
		const store = createStore({ invoice: { price: 10, name: 'invoice' } })
			.extendSetters(({ get, set }) => ({
				changeName() {
					set.invoice({ name: 'changed', price: get().invoice.price })
				},
				changePrice() {
					set.invoice({ name: get().invoice.name, price: get().invoice.price + 5 })
				},
			}))
			.extendGetters(({ get }) => ({
				price() {
					return get().invoice.price
				},
			}))

		function Component() {
			renderProbe()
			return <div>Price: {store.use.price()}</div>
		}

		render(<Component />)
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changeName())
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changeName())
		screen.getByText('Price: 10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changePrice())
		screen.getByText('Price: 15')
		expect(renderProbe).toHaveBeenCalledTimes(2)
		act(() => store.set.changePrice())
		screen.getByText('Price: 20')
		expect(renderProbe).toHaveBeenCalledTimes(3)
	})

	test('Applies custom plugin and makes it available for other methods', () => {
		const customPlugin = definePlugin((store) =>
			store.extendByState({ side: 3 }).extendGetters(({ get }) => ({
				area: () => {
					return get().side * get().side
				},
			}))
		)

		const store = createStore({ invoice: { price: 10, name: 'invoice' }, sideValue: 'name' })
			.composePlugin(customPlugin)
			.extendGetters((store) => ({
				invoicePlusArea() {
					return store.get().invoice.price + store.get.area()
				},
			}))
			.extendSetters(({ get, set }) => ({
				changeName() {
					set.invoice({ name: 'changed', price: get().invoice.price })
				},
			}))

		function Component() {
			renderProbe()
			return <div>Price: {store.use.invoicePlusArea()}</div>
		}

		render(<Component />)
		screen.getByText('Price: 19')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.sideValue('changed'))
		screen.getByText('Price: 19')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changeName())
		screen.getByText('Price: 19')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.side(5))
		screen.getByText('Price: 35')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Auto generates getters at any depth', () => {
		const store = createStore({ a: { b: { c: { d: 10 } } } })

		function Component() {
			renderProbe()
			return (
				<div>
					<div>A:{JSON.stringify(store.get().a)}</div>
					<div>B:{JSON.stringify(store.get().a.b)}</div>
					<div>C:{JSON.stringify(store.get().a.b.c)}</div>
					<div>D:{JSON.stringify(store.get().a.b.c.d)}</div>
				</div>
			)
		}

		render(<Component />)
		screen.getByText('A:{"b":{"c":{"d":10}}}')
		screen.getByText('B:{"c":{"d":10}}')
		screen.getByText('C:{"d":10}')
		screen.getByText('D:10')
	})

	test('Tracks variables at any depth', () => {
		const store = createStore({ a: { b: { c: { d: 10 } } } }).extendSetters(({ get, set }) => ({
			setOldB() {
				set.a({ b: get().a.b })
			},
			setOldC() {
				set.a({ b: { c: get().a.b.c } })
			},
			setNewD() {
				set.a({ b: { c: { d: get().a.b.c.d + 5 } } })
			},
		}))

		function Component() {
			renderProbe()
			return <div>C:{JSON.stringify(store.use.a.b.c())}</div>
		}

		render(<Component />)
		screen.getByText('C:{"d":10}')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setOldB())
		screen.getByText('C:{"d":10}')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setOldC())
		screen.getByText('C:{"d":10}')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setNewD())
		screen.getByText('C:{"d":15}')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can use any simple selector on the spot', () => {
		const store = createStore({ a: { b: { c: { d: 10 } } } }).extendSetters(({ get, set }) => ({
			setOldB() {
				set({ a: { b: get().a.b } })
			},
			setOldC() {
				set.a({ b: { c: get().a.b.c } })
			},
			setNewD() {
				set.a({ b: { c: { d: get().a.b.c.d + 5 } } })
			},
		}))

		function Component() {
			renderProbe()
			return <div>C:{JSON.stringify(store.use((state) => state.a.b.c.d))}</div>
		}

		render(<Component />)
		screen.getByText('C:10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setOldB())
		screen.getByText('C:10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setOldC())
		screen.getByText('C:10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setNewD())
		screen.getByText('C:15')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can access whole state with a get shortcut', () => {
		const store = createStore({ a: { b: { c: { d: 10 } } } })

		function Component() {
			return <div>State:{JSON.stringify(store.get())}</div>
		}

		render(<Component />)
		screen.getByText('State:{"a":{"b":{"c":{"d":10}}}}')
	})

	test('Restricts get state on first level', () => {
		const store = createStore({ a: { b: { c: { d: 10 } } }, e: 20 }).restrictState(['a'])

		function Component() {
			return <div>State:{JSON.stringify(store.get())}</div>
		}

		render(<Component />)
		screen.getByText('State:{"e":20}')
	})

	test('Can set state with top level set function', () => {
		const store = createStore({ a: { b: 10 }, e: 20 }).restrictState()

		function Component() {
			renderProbe()
			return <div>B:{JSON.stringify(store.use.a.b())}</div>
		}

		render(<Component />)
		screen.getByText('B:10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set({ e: 30 }))
		screen.getByText('B:10')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set({ a: { b: 15 } }))
		screen.getByText('B:15')
		expect(renderProbe).toHaveBeenCalledTimes(2)
		act(() => store.set((state) => ({ ...state, a: { b: state.a.b + 5 } })))
		screen.getByText('B:20')
		expect(renderProbe).toHaveBeenCalledTimes(3)
	})

	test('Proper functional overriding of previous getters', () => {
		const store = createStore({ a: { b: 10 }, e: 20 })
			.extendGetters(({ get }) => ({
				customGetter() {
					return get().e
				},
			}))
			.extendGetters(({ get }) => ({
				customGetter() {
					return get.customGetter()
				},
			}))

		function Component() {
			renderProbe()
			return <div>E:{JSON.stringify(store.get.customGetter())}</div>
		}

		render(<Component />)
		screen.getByText('E:20')
	})

	test('Proper functional overriding of previous getters with setters', () => {
		const store = createStore({ a: { b: 10 }, e: 20 })
			.extendGetters(({ get }) => ({
				customGetter() {
					return get().e + 10
				},
			}))
			.extendSetters(({ get, set }) => ({
				multiplyEarly() {
					return set.e(get.customGetter() * 2)
				},
			}))
			.extendGetters(({ get }) => ({
				customGetter() {
					return get().e + 30
				},
			}))
			.extendSetters(({ get, set }) => ({
				multiplyLater() {
					return set.e(get.customGetter() * 2)
				},
			}))

		function Component() {
			renderProbe()
			return <div>E:{JSON.stringify(store.use.customGetter())}</div>
		}

		render(<Component />)
		screen.getByText('E:50')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.multiplyEarly())
		screen.getByText('E:90')
		expect(renderProbe).toHaveBeenCalledTimes(2)
		act(() => store.set.multiplyLater())
		screen.getByText('E:210')
		expect(renderProbe).toHaveBeenCalledTimes(3)
		act(() => store.set.multiplyEarly())
		screen.getByText('E:410')
		expect(renderProbe).toHaveBeenCalledTimes(4)
	})

	test('Proper type for setter override', () => {
		const store = createStore({ a: 20 })
			.extendSetters(({ get, set }) => ({
				multiply(times: number) {
					return set.a(get().a * times)
				},
			}))
			.extendSetters(({ get, set }) => ({
				multiply(how: 'two' | 'three') {
					return set.a(get().a * (how === 'two' ? 2 : 3))
				},
			}))

		function Component() {
			renderProbe()
			return <div>A:{JSON.stringify(store.use.a())}</div>
		}

		render(<Component />)
		screen.getByText('A:20')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.multiply('three'))
		screen.getByText('A:60')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can listen to multiple values', () => {
		const store = createStore({ a: 'a', b: 'b', c: 'c', d: 'd' }).extendSetters(({ set }) => ({
			changeA() {
				return set.a('A')
			},
			changeC() {
				return set.c('C')
			},
		}))

		function Component() {
			renderProbe()
			return <div>{JSON.stringify(store.use(['a', 'b']))}</div>
		}

		render(<Component />)
		screen.getByText('{"a":"a","b":"b"}')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.changeA())
		screen.getByText('{"a":"A","b":"b"}')
		expect(renderProbe).toHaveBeenCalledTimes(2)
		act(() => store.set.changeC())
		screen.getByText('{"a":"A","b":"b"}')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can extend state with plain data', () => {
		const store = createStore({ a: 'a' }).extendByState({ b: 'b' })

		function Component() {
			renderProbe()
			return <div>{store.use.b()}</div>
		}

		render(<Component />)
		screen.getByText('b')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.b('c'))
		screen.getByText('c')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can reuse extended state', () => {
		const store = createStore({ a: 'a' })
			.extendByState({ b: 'b' })
			.extendByState(({ get }) => ({ c: get().b + 'b' }))
			.extendGetters(({ get }) => ({ getB: () => get().b + 'c' }))
			.extendSetters(({ get, set }) => ({
				setB: () => {
					set.b(get().b + 'd')
				},
			}))

		function Component() {
			renderProbe()
			return <div>{store.use.getB()}</div>
		}

		render(<Component />)
		screen.getByText('bc')
		expect(renderProbe).toHaveBeenCalledTimes(1)
		act(() => store.set.setB())
		screen.getByText('bdc')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Can extend state from the current state', () => {
		const store = createStore({ a: 'a' }).extendByState(({ get }) => ({ b: get().a + 'b' }))

		function Component() {
			renderProbe()
			return <div>{store.use.b()}</div>
		}

		render(<Component />)
		screen.getByText('ab')
		expect(renderProbe).toHaveBeenCalledTimes(1)
	})

	test('Logs setter name on various occasions', () => {
		const store = createStore({ count: 20 }).extendSetters(({ get, set }) => ({
			multiply(times: number) {
				return set.count(get().count * times)
			},
			multiplyWithSet(times: number) {
				return set({ count: get().count * times })
			},
		}))

		store.set({ count: 27 })
		store.set.count(25)
		store.set.multiply(4)
		store.set.multiplyWithSet(4)

		// Cannot spy on functions. Tested with logs.
	})

	test('Custom equality function for parameterized getter', () => {
		const store = createStore({
			items: [
				{ id: 1, name: 'Item 1', metadata: { timestamp: 0 } },
				{ id: 2, name: 'Item 2', metadata: { timestamp: 0 } },
			],
		})
			.extendSetters(({ get, set }) => ({
				updateItemMetadata(id: number) {
					set.items(
						get().items.map((item) =>
							item.id === id ? { ...item, metadata: { timestamp: Date.now() } } : item
						)
					)
				},
				updateItemName(id: number, name: string) {
					set.items(get().items.map((item) => (item.id === id ? { ...item, name } : item)))
				},
			}))
			.extendGetters(({ get }) => ({
				getItemById(id: number) {
					return get().items.find((item) => item.id === id)
				},
			}))

		function ComponentWithShallow() {
			renderProbe()
			const item = store.use.getItemById(1)
			return <div>Item: {item?.name}</div>
		}

		function ComponentWithCustomEquality() {
			renderProbe()
			// Only re-render if id or name changes, ignore metadata changes
			const item = store.use.getItemById(1, {
				eq: (a, b) => a?.id === b?.id && a?.name === b?.name,
			})
			return <div>Custom: {item?.name}</div>
		}

		// Test with shallow equality (default) - will re-render on metadata change
		const { unmount } = render(<ComponentWithShallow />)
		screen.getByText('Item: Item 1')
		expect(renderProbe).toHaveBeenCalledTimes(1)

		act(() => store.set.updateItemMetadata(1))
		// Should re-render because metadata changed (shallow comparison sees new object)
		expect(renderProbe).toHaveBeenCalledTimes(2)

		unmount()
		renderProbe.mockClear()

		// Test with custom equality - should NOT re-render on metadata change
		render(<ComponentWithCustomEquality />)
		screen.getByText('Custom: Item 1')
		expect(renderProbe).toHaveBeenCalledTimes(1)

		act(() => store.set.updateItemMetadata(1))
		// Should NOT re-render because custom equality ignores metadata
		expect(renderProbe).toHaveBeenCalledTimes(1)

		// But SHOULD re-render when name changes
		act(() => store.set.updateItemName(1, 'Updated Item 1'))
		screen.getByText('Custom: Updated Item 1')
		expect(renderProbe).toHaveBeenCalledTimes(2)
	})

	test('Types', () => {
		function Component() {
			const store0 = createStore({ value: 2 })

			store0.set.value(3)
			const use0Value = store0.use.value()
			const get0Value = store0.get().value

			const store1 = createStore({ value: 2 })
				.extendByState({ newer: 1 })
				.extendGetters(() => ({
					newField() {
						return '2'
					},
				}))
				.extendByState({ extended: '2' })
				.extendSetters(({ get, set }) => ({
					setting(extended: string) {
						set.extended(get().extended + extended)
					},
				}))

			store1.set.value(3)
			const use1Value = store1.use.value()
			const get1Value = store1.get().value
			const get1NewField = store1.get.newField()
			const use1NewField = store1.use.newField()
			store1.set.setting('3')

			const plugin1 = definePlugin((store) =>
				store
					.extendSetters(() => ({
						oneSetter: (oneSetterArg: number) => {
							console.log(oneSetterArg)
						},
					}))
					.extendGetters(() => ({
						oneGetter: () => {
							return 'string'
						},
					}))
					.extendByState({ one: 1 })
			)

			const store2 = createStore({ value: 2 }).composePlugin(plugin1)

			store2.set.value(3)
			const use2Value = store2.use.value()
			const get2Value = store2.get().value
			const use2One = store2.use.one()
			const get2One = store2.get().one
			const use2Getter = store2.use.oneGetter()
			const get2Getter = store2.get.oneGetter()
			store2.set.one(3)
			store2.set.oneSetter(3)

			const plugin2 = definePlugin((store) =>
				store
					.extendByState({ two: 'string' })
					.extendSetters(({ get }) => ({
						oneSetter: () => {
							console.log(get().two)
						},
						twoSetter: (twoSetterArg: number) => {
							console.log(twoSetterArg)
						},
					}))
					.extendGetters(() => ({
						oneGetter: () => {
							return true
						},
						twoGetter: () => {
							return 'string'
						},
					}))
			)

			const store3 = createStore({ value: 2 }).composePlugin(plugin1).composePlugin(plugin2)

			store3.set.value(3)
			const use3Value = store3.use.value()
			const get3Value = store3.get().value
			const use3One = store3.use.one()
			const get3One = store3.get().one
			const use3Getter = store3.use.one()
			const get3Getter = store3.get.oneGetter()
			store3.set.one(3)
			store3.set.oneSetter()
			const use3Getter2 = store3.use.two()
			const get3Getter2 = store3.get.twoGetter()
			store3.set.two('string')
			store3.set.twoSetter(3)

			const plugin3 = definePlugin((store) =>
				store
					.extendByState({ three: 2 })
					.extendSetters(({ api, set }) => ({
						threeSetter: () => set(api.getInitialState?.() ?? {}, true),
					}))
					.extendGetters(() => ({ threeGetter: () => ['string'] }))
					.extendByState({ value: 'string' })
			)

			const store4 = createStore({ value: 2 })
				.composePlugin(plugin1)
				.composePlugin(plugin2)
				.composePlugin(plugin3)

			store4.set.value(2)
			const use4Value = store4.use.value()
			const get4Value = store4.get().value
			const use4One = store4.use.one()
			const get4One = store4.get().one
			const use4Getter = store4.use.one()
			const get4Getter = store4.get.oneGetter()
			store4.set.one(1)
			store4.set.oneSetter()
			const use4Getter2 = store4.use.two()
			const get4Getter2 = store4.get.twoGetter()
			store4.set.two('string')
			store4.set.twoSetter(1)
			store4.set.three(2)
			const use4Three = store4.use.three()
			const get4Three = store4.get().three
			const get4ThreeGetter = store4.get.threeGetter()
			store4.set.threeSetter()

			console.log({
				use0Value,
				get0Value,
				use1Value,
				get1Value,
				get1NewField,
				use1NewField,
				use2Value,
				get2Value,
				use2One,
				get2One,
				get2Getter,
				use2Getter,
				use3Value,
				get3Value,
				use3One,
				get3One,
				use3Getter,
				get3Getter,
				use3Getter2,
				get3Getter2,
				use4Value,
				get4Value,
				use4One,
				get4One,
				use4Getter,
				get4Getter,
				use4Getter2,
				get4Getter2,
				use4Three,
				get4Three,
				get4ThreeGetter,
			})
		}
	})
})

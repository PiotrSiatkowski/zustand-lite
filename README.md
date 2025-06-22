# 🧠 Zustand Lite

[![npm version](https://img.shields.io/npm/v/zustand-lite?color=blue)](https://www.npmjs.com/package/zustand-lite)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zustand-lite)](https://bundlephobia.com/package/zustand-lite)
[![license](https://img.shields.io/npm/l/zustand-lite)](./LICENSE)
[![Types](https://img.shields.io/badge/TypeScript-ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/PiotrSiatkowski/zustand-lite?style=social)](https://github.com/PiotrSiatkowski/zustand-lite)

Zustand Lite is a **zero-boilerplate** state management built specifically for frontend
developers who want **powerful and scalable** global state **without the usual complexity**.
Designed for simplicity, it gives you everything you need out-of-the-box — from selectors to 
setters to middleware — while remaining lightweight and extensible. With seamless support for 
plugins, devtools, and state encapsulation, managing state becomes a breeze, not a chore.

_A zero-boilerplate wrapper around [Zustand](https://github.com/pmndrs/zustand), focused on
ergonomics, plugins, and dynamic extension — inspired by [zustand-x](https://github.
com/udecode/zustand-x) and getters/setters auto-generation patterns._

## 🛠️ Why **zustand‑lite**?

### ✅ TL;DR

_**Zustand Lite** delivers a **simple**, **performant**, and **predictable** way to manage UI
state, letting your code stay focused on business logic, not infrastructure. Try it today and
see how effortless frontend state can be!_

While tools like React‑Query handle server state, UI state often gets bogged down by excessive
boilerplate, tangled data flows, and hard‑to‑control side effects. **Zustand Lite** cuts through
the noise:

## 🚀 Features

- ⚛️ **Minimal & Typed**: Built on top of lightweight Zustand core, fully typed with TypeScript.
- 🔄 **Clean Separation**: State and operations are well separated to minimize confusion.
- 🚀 **Blazing Performance**: Selective updates and lean subscriptions keep things snappy.
- 🪄 **Zero Boilerplate**: No mock setups, no dependency arrays, just importing and using.
- 🧪 **Test‑Friendly Design**: Easily tested, no context or mock hacks required.
- 🌱 **Composable & Extensible**: Opinionated defaults that adapt as your application grows.
- 🔌 **Shareable plugin system**: Plug custom logic directly into your store for extended capabilities.
- 🧩 **Optional middleware integration**: Seamlessly add devtools and persist, middlewares that matter.
- 🛠 **Chainable API**: `extendGetters()`, `extendSetters()`, `restrictState()`- create store in composable steps.
- 👁 **Redux devtools labeling**: Built-in clear, traceable actions and labels for debugging.
- 🧼 **No dependencies, only Zustand**: Keeps bundle size small and performance high.
- 😊 **Write only code you need**: Focus on business logic, not boilerplate.

## ✨ Why it matters

Boilerplate is the killer of productivity and obscures your real goal: **business logic**, which is usually far simpler than it appears.  
Thanks to **zustand‑lite**, you can move faster without sacrificing clarity or flexibility:

1. **No Context Providers** or React-specific setup
2. **No Mocking** during tests
3. **No bloated dependency arrays**
4. **Type-safe, simple API** - designed for everyday use

---

## 🛠 Common Recipes

### Simple store

```ts
import { createStore } from 'zustand-lite'

const initialState: { foo: string } = { foo: '' }

export const store = createStore(initialState)

// Subscribe for your data changes.
function Component() {
	const foo = store.use.foo()
}

// Synchronous accessor, when you need it.
function onClick() {
	console.log(store.get().foo)
}

// Setting value with one line as it should be.
function onClick() {
	store.set.foo('new-value')
}
```

### Custom Setters

const store = createStore({ count: 0 })
  .extendSetters(({ get, set }) => ({
    increment: () => set.count(get().count + 1)
  }))

function Counter() {
  const count = store.use.count()
  return (
    <button onClick={store.set.increment}>
      Count: {count}
    </button>
  )
}

### Advanced store

```ts
const initialState: { foo: string; bar: { x: number; y: number } } = {
  point: { x: 0, y: 0 },
  rectangle: { a: 20, b: 10 },
}

export const store = createStore(initialState)
  .extendGetters(({ get }) => ({
    area: () => get().bar.x * get().bar.y
  }))
  .extendSetters(({ get, set }) => ({
    translateX: (dx: number) => set.bar({ x: get().point.x + dx, y: get().point.y }),
  }))
  .restrictState(['rectangle'])
  // ^ Seal the store, so that certain fields are unavailable for the outside context.

// Subscribe for computed data changes.
function Component() {
  const area = store.use.area()
}

// Make private value inaccessible.
function onClick() {
  console.log(store.get().rectangle) <- TS error, no value
}

// Call custom action.
function onClick() {
  store.set.translateX(7)
}

// Access native Zustand api (expect getState, setState, which are available thrugh store.get 
and store.set).
function Component() {
  const state = store.api.getInitialState()
}
```

### Deep selectors

```ts
const initialState: { my: { foo: { bar: string} } } = {
	my: { foo: { bar: 'value' } },
}

export const store = createStore(initialState)
    .myFooBar(({ get }) => ({
		return get().my.foo.bar;
	}))
	.restrictState()

// Component will update only if deeply nested value will update.
function Component() {
  const myFooBar = store.use.myFooBar()
}
```

### Automatic deep selectors

```ts
const initialState: { my: { foo: { bar: string } } } = { my: { foo: { bar: 'value' } } }

export const store = createStore(initialState)

// Component will update only if deeply nested value will update. Those selectors
// will be generated for hooks only for required attributes.
function Component() {
	const myFooBar = store.use.my.foo.bar()
}
```

### Ad-hoc selectors

```ts
const initialState: { my: { foo: { bar: string } } } = { my: { foo: { bar: 'value' } } }

export const store = createStore(initialState)

// If no auto-generated selector is available, custom one may still be used.
function Component() {
	const myFooBar = store.use((state) => state.my.foo, customEquality)
}
```

### Setting whole state

```ts
const initialState: { my: { foo: { bar: string } } } = { my: { foo: { bar: 'value' } } }

export const store = createStore(initialState)

// State can be set with first level auto-generated setters or with store.set
store.set((state) => ({ ...state, newField: 'newField' }))
```

### Overriding getters and setters

```ts
const initialState: { point: { x: number; y: number }; rectangle: { a: number; b: number } } = {
	point: { x: 0, y: 0 },
	rectangle: { a: 20, b: 10 },
}

export const store = createStore(initialState)
	.extendGetters(({ get }) => ({
		// get().point refers to the store value
		myPoint: () => transformToDifferentCoordinates(get().point),
	}))
	.extendGetters(({ get }) => ({
		// get.myPoint() will reference to the already transformed point from the previous getter
		// definition. It will override the previous one, but can use it inside.
		myPoint: () => soSomethingWithTransformedPoint(get.myPoint()),
	}))
	.restrictState()
```

### Custom equality

```ts
const initialState: { rectangle: { a: number; b: number } } = { rectangle: { a: 20, b: 10 } }

export const store = createStore(initialState).restrictState()

// By default shallow equality is being used.
function Component() {
	const rectangle = store.use.rectangle(customEqualityFunction)
}
```

### Testing features

```ts
function Component() {
  const dependencyA = store.use.dependencyA()
}

// No need to mock the store or add additional providers, just interact with it in the test.
test('Testing Component', () => ({
  render(<Component />)
  act(() => store.set.dependencyA(someValue))
  expect(somethingStoreDependant).toBe(someValue)
})
```

---

## 🧠 API Overview

### `createStore(initialState, options)`

Creates a typed store with optional plugins and middleware.

**Options:**

| Key           | Type                                                                       | Description                          |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `name`        | `string`                                                                   | Name shown in Redux DevTools         |
| `plugins`     | `StoreApiPlugin[]`                                                         | Array of plugins to extend the store |
| `middlewares` | `{ devtools?: true or DevtoolsOptions, persist?: true or PersistOptions }` | Middleware configuration             |

### Chainable Methods

- **`.extendGetters(fn)`**  
  Add additional derived getters based on current state.

- **`.extendSetters(fn)`**  
  Add additional typed setters.

- **`.restrictState(keys?: string[])`**  
  Hide selected fields from the public API, returning a minimal store (removes config methods as well).

### Store Interface

After creation, your store includes:

| Property              | Purpose                                                         |
| --------------------- | --------------------------------------------------------------- |
| `store.use.foo()`     | React hook for subscribing to `foo`                             |
| `store.use(selector)` | React hook for subscribing to custom selector result            |
| `store.get()`         | Direct synchronous access to whole state                        |
| `store.set.foo(v)`    | Set a new value for `foo`                                       |
| `store.set(state)`    | Set an entire new state                                         |
| `store.api`           | The native Zustand store API (getInitialState, subscribe, etc.) |

---

## 🧩 Plugin System

You can define plugins that inject additional state or behavior:

```ts
import { StoreApiPlugin } from 'zustand-lite'

type Setters = { reset: () => void }

export const reset: StoreApiPlugin<{}, {}, Setters> = {
	extends: (store) => {
		// If plugin defines data, that and only that data is available inside
		// setters and getters.
		return store.extendSetters(({ api, set }) => ({
			reset: () => {
				const initialState = api.getInitialState?.() ?? {}
				set(() => initialState, true)
			},
		}))
	},
}
```

Apply it like this:

```ts
const store = createStore({}, { plugins: [reset] })
```

**Any plugin state, getters, setters will be available for usage inside your own store.**

---

## 🧪 Middlewares Integration

You can add the most useful middlewares:

```ts
{
  name: 'MyApp/CounterStore',
  middlewares: {
    devtools: true,
    persist: {
      ...options,
    },
  }
}
```

---

## 🛠 Planned improvements

- Configurable level of auto-generation. While I advise to keep store as flat as possible, good
  structured data is important. For deeper properties it might be more convenient to auto
  generate getters and setters for deeply nested properties as well. (done with hooks, entire
  state is selected for get)
- createPlugin function that will automatically infer types from the usage without the need of
  specifying types yourself, avoiding repetitiveness.
- Ability to specify equality function for extended getters. It's possible now, but requires to
  import hook from 'zustand' package, which is suboptimal (now available with custom selector
  notation or deep auto-generated selectors).

---

## 🧱 Built With

- [Zustand](https://github.com/pmndrs/zustand)
- Inspired by [zustand-x](https://github.com/udecode/zustand-x)

---

## 📘 License

MIT — free to use, extend, and improve.

---

## 🤝 Contributing

Pull requests, feedback, and ideas are welcome!  
If you'd like to publish your own plugins, we recommend namespacing them under:

```
zustand-lite/plugin-*
```

or adding them to the main repository under the plugins directory.

---

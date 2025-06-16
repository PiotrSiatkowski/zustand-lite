# 🧠 Zustand Lite

[![npm version](https://img.shields.io/npm/v/zustand-lite?color=blue)](https://www.npmjs.com/package/zustand-lite)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zustand-lite)](https://bundlephobia.com/package/zustand-lite)
[![license](https://img.shields.io/npm/l/zustand-lite)](./LICENSE)
[![Types](https://img.shields.io/badge/TypeScript-ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/PiotrSiatkowski/zustand-lite?style=social)](https://github.com/PiotrSiatkowski/zustand-lite)

---

Zustand Lite is a **zero-boilerplate** state management wrapper built specifically for **frontend developers** who want powerful and scalable global state without the usual complexity. Designed for simplicity, it gives you everything you need out-of-the-box — from selectors to setters to middleware — while remaining lightweight and extensible. With seamless support for plugins, devtools, and state encapsulation, managing state becomes a breeze, not a chore.

> A zero-boilerplate wrapper around [Zustand](https://github.com/pmndrs/zustand), focused on ergonomics, plugins, and powerful dynamic extension — inspired by [zustand-x](https://github.com/udecode/zustand-x) and selector auto-generation patterns.

---

## 🚀 Features

- 😊 Write only code that matters -> save lines
- ✅ Type-safe getter/setter generators for every field
- 🔌 First-class **plugin system**
- 🧩 Optional **middleware integration** (devtools, persist)
- 🛠 Chainable API: `.extendGetters(...)`, `.extendSetters(...)`, `.restrictState(...)`
- 👁 Named devtools actions and store labeling
- 🧼 No runtime dependencies other than Zustand

---

## 📦 Installation

```bash
npm install zustand zustand-lite
# or
pnpm add zustand zustand-lite
```

---

## 🛠 Basic Usage

```ts
import { createStore } from 'zustand-lite';

const initialState: {
  foo: string;
  bar: {
    x: number;
    y: number;
  }
} = {
  foo: '',
  bar: {
    x: 0,
    y: 0,
  }
};

export const store = createStore(initialState)
  .extendGetters(({ get }) => ({
    area: () => get.bar().x * get.bar().y,
  }))
  .extendSetters(({ get, set }) => ({
    translateX: (dx: number) => set.bar(({ x: get.bar().x + dx, y: get.bar().y })),
  }))
  .restrictState(['bar']);

// Usage
store.use.area();          // React-friendly subscription, re-renders only when area changes.
store.get.foo();           // Synchronous accessor
store.set.translateX(2);   // Safe setter
store.api.getState();      // Native Zustand store API
```

---

## 🧠 API Overview

### `createStore(initialState, options)`

Creates a typed store with optional plugins and middleware.

**Options:**

| Key          | Type                                                                       | Description                            |
|--------------|----------------------------------------------------------------------------|----------------------------------------|
| `name`       | `string`                                                                   | Name shown in Redux DevTools           |
| `plugins`    | `StoreApiPlugin[]`                                                         | Array of plugins to extend the store   |
| `middlewares`| `{ devtools?: true or DevtoolsOptions, persist?: true or PersistOptions }` | Middleware configuration               |

---

### Chainable Methods

- **`.extendGetters(fn)`**  
  Add additional derived getters based on current state.

- **`.extendSetters(fn)`**  
  Add additional typed setters.

- **`.restrictState(keys?: string[])`**  
  Hide selected fields from the public API, returning a minimal store (removes config methods as well).

---

### Store Interface

After creation, your store includes:

| Property           | Purpose                                                 |
|--------------------|---------------------------------------------------------|
| `store.use.foo()`  | React hook getter for subscribing to `foo`              |
| `store.get.foo()`  | Direct synchronous access to `foo`                      |
| `store.set.foo(v)` | Set a new value for `foo`                               |
| `store.api`        | The native Zustand store API (getState, setState, etc.) |

---

## 🧩 Plugin System

You can define plugins that inject additional state or behavior:

```ts
import { StoreApiPlugin } from 'zustand-lite';

type Setters = {
  reset: () => void;
};

export const reset: StoreApiPlugin<{}, {}, Setters> = {
  extends: store => {
    return store.extendSetters(({ api }) => ({
      reset: () => {
        const initialState = api.getInitialState?.() ?? {};
        api.setState(() => initialState, true);
      },
    }));
  },
};
```

Apply it like this:

```ts
const store = createStore({}, { plugins: [reset] });
```

---

## 🧪 DevTools Integration

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

![Zustand Lite Image](./image.png)

# Zustand Lite

[![npm version](https://img.shields.io/npm/v/zustand-lite?color=blue)](https://www.npmjs.com/package/zustand-lite)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zustand-lite)](https://bundlephobia.com/package/zustand-lite)
[![license](https://img.shields.io/npm/l/zustand-lite)](./LICENSE)
[![Types](https://img.shields.io/badge/TypeScript-ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/PiotrSiatkowski/zustand-lite?style=social)](https://github.com/PiotrSiatkowski/zustand-lite)

A thin wrapper around [Zustand](https://github.com/pmndrs/zustand) that generates getters, setters, and hooks for you.

```ts
import { createStore } from 'zustand-lite'

const store = createStore({ count: 0 })
    .extendSetters(({ get, set }) => ({
        increment: () => set.count(get().count + 1),
    }))

store.use.count()        // React hook
store.get().count        // Direct access
store.set.increment()    // Action
```

That's it. No providers, no boilerplate, full TypeScript support.

---

## Why?

Zustand Lite is a **zero-boilerplate** state management built specifically for frontend
developers who want **powerful and scalable** global state **without the usual complexity**.
Designed for simplicity, it gives you everything you need out-of-the-box — from selectors to
setters to middleware — while remaining lightweight and extensible. With seamless support for
plugins, devtools, and state encapsulation, managing state becomes a breeze, not a chore.

Zustand is great, but you still end up writing repetitive code: selectors for each field, actions that follow the same patterns, hooks that look almost identical.

Zustand Lite fixes that. You define your state once, and it generates:
- `store.use.fieldName()` - React hooks with proper subscriptions
- `store.set.fieldName(value)` - Type-safe setters
- `store.get()` - Synchronous access to current state

Plus a chainable API for computed values, custom actions, and plugins.

## Install

```bash
npm install zustand-lite zustand
```

---

## Examples

### Basic usage

```ts
import { createStore } from 'zustand-lite'

export const store = createStore({ name: '', email: '' })

// In your component
function Profile() {
    const name = store.use.name()
    const email = store.use.email()
    
    return <div>{name} ({email})</div>
}

// Update from anywhere
store.set.name('John')
store.set.email('john@example.com')
```

### Custom setters

```ts
const store = createStore({ count: 0 })
    .extendSetters(({ get, set }) => ({
        increment: () => set.count(get().count + 1),
        decrement: () => set.count(get().count - 1),
        reset: () => set.count(0),
    }))

// Use them directly
store.set.increment()
store.set.reset()

// Or in components
<button onClick={store.set.increment}>+</button>
```

### Computed values (getters)

```ts
const store = createStore({ 
    items: [] as { price: number; qty: number }[] 
})
    .extendGetters(({ get }) => ({
        total: () => get().items.reduce((sum, item) => sum + item.price * item.qty, 0),
        itemCount: () => get().items.length,
    }))

// Computed values work as hooks too
function CartSummary() {
    const total = store.use.total()
    const count = store.use.itemCount()
    
    return <div>{count} items, ${total}</div>
}
```

### Deep selectors

Nested state? No problem. Zustand Lite auto-generates deep selectors:

```ts
const store = createStore({ 
    user: { 
        profile: { 
            name: 'John' 
        } 
    } 
})

// These are all valid and properly subscribed
store.use.user()
store.use.user.profile()
store.use.user.profile.name()
```

### Select multiple fields

```ts
const store = createStore({ a: 1, b: 2, c: 3, d: 4 })

function Component() {
    // Only re-renders when a or c change
    const { a, c } = store.use(['a', 'c'])
}
```

### Custom equality

```ts
const store = createStore({ data: { id: 1, name: 'test', updatedAt: Date.now() } })

// Default uses shallow equality
const data = store.use.data()

// Custom equality for auto-generated selectors
const data = store.use.data((a, b) => a.id === b.id)

// Custom equality for ad-hoc selectors
const data = store.use(
    (state) => state.data,
    (a, b) => a.id === b.id
)
```

For getters with parameters, pass `{ eq }` as the last argument:

```ts
const store = createStore({ items: [{ id: 1, name: 'Item', meta: {} }] })
    .extendGetters(({ get }) => ({
        getById: (id: number) => get().items.find(i => i.id === id),
    }))

function Item({ id }: { id: number }) {
    // Only re-render when id or name changes, ignore meta
    const item = store.use.getById(id, {
        eq: (a, b) => a?.id === b?.id && a?.name === b?.name
    })
}
```

### Extending state

Add more state fields after creation:

```ts
const store = createStore({ a: 'a' })
    .extendByState({ b: 'b' })  // Plain object
    .extendByState(({ get }) => ({ c: get().a + get().b }))  // Derived from existing state
```

### Overriding getters and setters

Chain multiple `extendGetters` or `extendSetters` to override previous definitions. The new definition can access the previous one via `get.previousGetter()`:

```ts
const store = createStore({ price: 100 })
    .extendGetters(({ get }) => ({
        displayPrice: () => get().price,
    }))
    .extendGetters(({ get }) => ({
        // Override: add currency formatting, but use previous getter
        displayPrice: () => `$${get.displayPrice().toFixed(2)}`,
    }))

store.get.displayPrice() // "$100.00"
```

### Setting state

Multiple ways to update state:

```ts
const store = createStore({ a: 1, b: 2 })

// Auto-generated setters
store.set.a(10)

// Partial update (shallow merge)
store.set({ a: 10 })

// Function update
store.set((state) => ({ a: state.a + 1 }))

// Replace entire state (second arg = true)
store.set({ a: 100, b: 200 }, true)
```

### Private state

Sometimes you want internal state that components can't access directly:

```ts
const store = createStore({ 
    publicValue: 'visible',
    _internalCache: new Map(),
})
    .extendGetters(({ get }) => ({
        getCached: (key: string) => get()._internalCache.get(key),
    }))
    .restrictState(['_internalCache'])

// Works
store.get().publicValue
store.get.getCached('key')

// TypeScript error - _internalCache is hidden
store.get()._internalCache
```

### Plugins

Extract reusable patterns into plugins:

```ts
import { definePlugin } from 'zustand-lite'

// A loading state plugin
const withLoading = definePlugin((store) =>
    store
        .extendByState({ isLoading: false, error: null as string | null })
        .extendSetters(({ set }) => ({
            startLoading: () => { set.isLoading(true); set.error(null) },
            stopLoading: () => set.isLoading(false),
            setError: (error: string) => { set.error(error); set.isLoading(false) },
        }))
)

// Use it
const store = createStore({ data: null })
    .composePlugin(withLoading)
    .extendSetters(({ set }) => ({
        async fetchData() {
            set.startLoading()
            try {
                const data = await api.getData()
                set.data(data)
            } catch (e) {
                set.setError(e.message)
            } finally {
                set.stopLoading()
            }
        },
    }))
```

### Middleware (devtools & persist)

```ts
const store = createStore(
    { count: 0 },
    {
        name: 'CounterStore',
        middlewares: {
            devtools: true,  // Redux DevTools integration
            persist: true,   // localStorage persistence
        },
    }
)
```

Actions show up in DevTools with clear labels like `CounterStore/count` or `CounterStore/myOwnAction`.

---

## API Reference

### `createStore(initialState, options?)`

Creates a store with auto-generated hooks and setters.

**Options:**
| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | Name for DevTools |
| `middlewares` | `{ devtools?, persist? }` | Enable middleware |

### Chainable methods

| Method | Description |
|--------|-------------|
| `.extendByState(obj \| fn)` | Add more state fields |
| `.extendGetters(fn)` | Add computed values |
| `.extendSetters(fn)` | Add custom actions |
| `.composePlugin(plugin)` | Apply a plugin |
| `.restrictState(keys?)` | Hide fields from public API |

### Store interface

| Property | Description |
|----------|-------------|
| `store.use.field()` | React hook for `field` |
| `store.use(selector, eq?)` | Hook with custom selector |
| `store.use(['a', 'b'])` | Hook for multiple fields |
| `store.get()` | Current state (no subscription) |
| `store.get.getter()` | Call a computed getter |
| `store.set.field(value)` | Update a field |
| `store.set(partial)` | Merge partial state |
| `store.set(fn)` | Update with function |
| `store.api` | Raw Zustand API |

---

## Testing

No mocks needed. Just use the store directly:

```ts
import { store } from './store'

test('increment works', () => {
    store.set.count(0)
    store.set.increment()
    expect(store.get().count).toBe(1)
})

test('component updates', () => {
    render(<Counter />)
    act(() => store.set.count(5))
    expect(screen.getByText('5')).toBeInTheDocument()
})
```

---

## Roadmap

- [x] Custom equality for parameterized getters
- [ ] Auto-generate deep setters (currently only first level)
- [ ] Subscribe with selector middleware

---

## Credits

Built on [Zustand](https://github.com/pmndrs/zustand). Inspired by [zustand-x](https://github.com/udecode/zustand-x).

## License

MIT

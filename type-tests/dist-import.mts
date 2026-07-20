import {
	createStore,
	type StoreApi,
	type StoreApiEncapsulated,
	type UseGetterOptions,
	withOptions,
	withReset,
} from 'zustand-lite'

const store: StoreApi<{ count: number }> = createStore({ count: 0 })
const resettable = createStore({ count: 0 }).composePlugin(withReset)
const restricted: StoreApiEncapsulated<{ count: number }> = createStore({
	count: 0,
}).restrictState()
const options: UseGetterOptions<number> = withOptions({ eq: Object.is })

store.set.count(1)
resettable.set.reset()
restricted.get().count
options.eq(1, 1)

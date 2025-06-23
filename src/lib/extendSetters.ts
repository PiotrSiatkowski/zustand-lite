import { StoreApi as StoreLib } from 'zustand/vanilla'
import { Default, SettersBuilder, State, StoreApi } from '../types'
import { generateSetFn } from './generateSetFn'

export function extendSetters<
	Builder extends SettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, store: StoreApi<S, Getters, Setters>, lib: StoreLib<S>, hasDevtools: boolean) {
	const setters = generateSetFn(lib, hasDevtools)
	store.set = Object.assign(setters, store.set, builder(store))
	return store
}

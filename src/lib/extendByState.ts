import { ByStateBuilder, Default, State, StoreApi } from '../types'
import { generateUse } from './generateUse'
import { generateSet } from './generateSet'
import { StoreApi as StoreLib } from 'zustand/vanilla'

export function extendByState<
	Builder extends ByStateBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(
	builder: Builder | Partial<S>,
	api: StoreApi<S, Getters, Setters>,
	lib: StoreLib<S>,
	log: boolean
) {
	const newState: Partial<S> = typeof builder === 'function' ? builder(api) : builder

	// Merge the new keys into the zustand state.
	api.set(newState)

	// @ts-ignore
	api.use = { ...api.use, ...generateUse(lib, Object.keys(newState)) }
	api.set = { ...api.set, ...generateSet(lib, Object.keys(newState), log) }

	// Return the same object, but with widened state type (handled by overloads).
	return api
}

import { StoreApi as StoreLib } from 'zustand/vanilla'
import { ByStateBuilder, State, StoreApi } from '../types'
import { generateSet } from './generateSet'
import { generateUse } from './generateUse'

/**
 * Extends the store by adding new state fields, either by:
 *   - passing an object patch:  `{ b: 'x' }`
 *   - or using a builder:      `({ get }) => ({ c: get().b + 'y' })`
 *
 * @param builder  Object patch or function producing new state fields.
 * @param api      The extended store API before widening.
 * @param lib      The underlying Zustand vanilla store.
 * @param log      Enables logging for generated setters.
 *
 * @returns The same API instance, but with widened state (via overloads).
 */
export function extendByState<
	NewData extends State,
	OldData extends State,
	Getters,
	Setters,
	Builder extends ByStateBuilder<NewData, OldData, Getters>,
>(
	builder: Builder | NewData,
	api: StoreApi<OldData, Getters, Setters>,
	lib: StoreLib<OldData>,
	log: boolean
) {
	// Calculate new state to be added to the store.
	const newState: NewData = typeof builder === 'function' ? builder(api) : builder

	// Merge the new keys into the zustand state.
	lib.setState(newState as unknown as OldData)

	// Generate basic getters and setters from the newly added record.
	api.use = { ...api.use, ...generateUse(lib, Object.keys(newState)) }
	api.set = { ...api.set, ...generateSet(lib, Object.keys(newState), log) }

	// Return the same object, but with widened state type (handled by overloads).
	return api
}

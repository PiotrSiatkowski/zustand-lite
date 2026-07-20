import { StoreApi as StoreLib } from 'zustand/vanilla'
import { ByStateBuilder, State, StoreApi } from '../types'
import { assertPlainState, assignEnumerableProperties } from '../utils/object'
import { generateSetFn } from './generateSetFn'
import { generateUseFn } from './generateUseFn'

/**
 * Extends the store by adding new state fields, either by:
 *   - passing an object patch:  `{ b: 'x' }`
 *   - or using a builder:       `({ get }) => ({ c: get().b + 'y' })`
 *
 * @param factory Object patch or function producing new state fields.
 * @param storeApi Zustand Lite API before its state type is widened.
 * @param storeLib Underlying Zustand vanilla store.
 * @param shouldLog Whether generated setters should include devtools metadata.
 *
 * @returns The same API instance, but with widened state (via overloads).
 */
export function extendByState<
	AddedState extends State,
	StoreState extends State,
	GetMethods,
	SetMethods,
	AddBuilder extends ByStateBuilder<AddedState, StoreState, GetMethods>,
>(
	factory: AddBuilder | AddedState,
	storeApi: StoreApi<StoreState, GetMethods, SetMethods>,
	storeLib: StoreLib<StoreState>,
	shouldLog: boolean
) {
	const nextState: AddedState = typeof factory === 'function' ? factory(storeApi) : factory
	assertPlainState(nextState, 'Extended state')

	// Existing fields win at runtime, matching the no-overlapping-keys type contract.
	const baseState = { ...nextState, ...storeApi.api.getInitialState() }
	storeApi.set({ ...nextState, ...storeLib.getState() })
	storeApi.api.getInitialState = () => baseState

	const stateKeys = Object.keys(nextState)
	const useFields = generateUseFn(storeLib, stateKeys)
	const setFields = generateSetFn(storeLib, stateKeys, shouldLog)

	// These assignments mutate the existing chainable API while its return type widens.
	// @ts-ignore The public overloads carry the widened hook shape.
	storeApi.use = assignEnumerableProperties(storeApi.use, useFields)
	storeApi.set = assignEnumerableProperties(storeApi.set, setFields)

	return storeApi
}

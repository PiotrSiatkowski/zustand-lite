import { StoreApi as StoreLib } from 'zustand/vanilla'
import { SettersBuilder, State, StoreApi } from '../types'
import { assignEnumerableProperties } from '../utils/object'
import { generateSetFnBase } from './generateSetFnBase'

/**
 * Adds custom setter methods to the store.
 *
 * @param factory Function returning new setter methods.
 * @param storeApi Current Zustand Lite API.
 * @param storeLib Underlying Zustand vanilla store.
 * @param shouldLog Whether setters should include devtools metadata.
 */
export function extendSetters<
	SetBuilder extends SettersBuilder<StoreState, GetMethods, SetMethods>,
	StoreState extends State,
	GetMethods,
	SetMethods,
>(
	factory: SetBuilder,
	storeApi: StoreApi<StoreState, GetMethods, SetMethods>,
	storeLib: StoreLib<StoreState>,
	shouldLog: boolean
) {
	const setBase = generateSetFnBase(storeLib, shouldLog)
	const actions = {} as Record<string, any>

	for (const [name, handler] of Object.entries(factory(storeApi))) {
		// The sentinel name lets generateSetterName locate the caller one stack frame above.
		actions[name] = function _zustandLiteInferName_(...args: any[]) {
			return handler(...args)
		}
	}

	storeApi.set = assignEnumerableProperties(setBase, storeApi.set, actions)
	return storeApi
}

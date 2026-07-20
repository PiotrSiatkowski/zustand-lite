import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { BrandedUseGetterOptions, GettersBuilder, State, StoreApi } from '../types'
import { getterOptionsMarker } from '../utils/optionsMarker'
import { assignEnumerableProperties } from '../utils/object'
import { generateGetFnBase } from './generateGetFnBase'
import { generateUseFnBase } from './generateUseFnBase'

/**
 * Adds derived getters to the store.
 *
 * @param factory Function returning new getter methods.
 * @param storeApi Current Zustand Lite API.
 * @param storeLib Underlying Zustand vanilla store.
 */
export function extendGetters<
	GetBuilder extends GettersBuilder<StoreState, GetMethods>,
	StoreState extends State,
	GetMethods,
	SetMethods,
>(
	factory: GetBuilder,
	storeApi: StoreApi<StoreState, GetMethods, SetMethods>,
	storeLib: StoreLib<StoreState>
) {
	const getMethods: any = factory({ get: storeApi.get })
	const useMethods: any = {}

	Object.keys(getMethods).forEach((methodName) => {
		useMethods[methodName] = (...callArgs: any[]) => {
			const finalArg = callArgs[callArgs.length - 1]

			// Branded options are removed before invoking the underlying business getter.
			if (isEqualityOptions(finalArg)) {
				return useStoreWithEqualityFn(
					storeLib,
					() => getMethods[methodName](...callArgs.slice(0, -1)),
					finalArg.eq
				)
			}

			return useStoreWithEqualityFn(
				storeLib,
				() => getMethods[methodName](...callArgs),
				shallow
			)
		}
	})

	storeApi.use = assignEnumerableProperties(generateUseFnBase(storeLib), storeApi.use, useMethods)
	storeApi.get = assignEnumerableProperties(generateGetFnBase(storeLib), storeApi.get, getMethods)

	return storeApi
}

/**
 * Type guard to check if a value is an equality options object.
 * Detects branded objects created by `withOptions`.
 */
function isEqualityOptions<R>(value: unknown): value is BrandedUseGetterOptions<R> {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as Record<PropertyKey, unknown>)[getterOptionsMarker] === true &&
		typeof (value as any).eq === 'function'
	)
}

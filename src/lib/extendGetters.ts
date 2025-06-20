import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'

import { Default, GettersBuilder, State, StoreApi } from '../types'

export function extendGetters<
	Builder extends GettersBuilder<T, Getters, Setters>,
	T extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, thisApi: StoreApi<T, Getters, Setters>) {
	const use = { ...thisApi.use }
	const get = { ...thisApi.get }

	Object.keys(builder(thisApi)).forEach((key) => {
		// @ts-ignore
		use[key] = (...args: any[]) =>
			useStoreWithEqualityFn(
				thisApi.api,
				() => {
					return builder(thisApi)[key](...args)
				},
				shallow
			)

		// @ts-ignore
		get[key] = (...args: any[]) => {
			return builder(thisApi)[key](...args)
		}
	})

	return { ...thisApi, get, use } as StoreApi<T, Getters & ReturnType<Builder>, Setters>
}

import { shallow } from 'zustand/shallow'
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { StoreApi as StoreLib } from 'zustand/vanilla'

import { Default, GettersBuilder, State, StoreApi } from '../types'

export function extendGetters<
	Builder extends GettersBuilder<S, Getters, Setters>,
	S extends State = Default,
	Getters = Default,
	Setters = Default,
>(builder: Builder, api: StoreApi<S, Getters, Setters>, lib: StoreLib<S>) {
	Object.keys(builder(api)).forEach((key) => {
		// @ts-ignore
		api.use[key] = (...args: any[]) =>
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useStoreWithEqualityFn(
				lib,
				() => {
					return builder(api)[key](...args)
				},
				shallow
			)

		// @ts-ignore
		api.get[key] = (...args: any[]) => {
			return builder(api)[key](...args)
		}
	})

	return api as StoreApi<S, Getters & ReturnType<Builder>, Setters>
}

import { GetRecord, SetRecord, State, StoreApi } from '../types'

export function restrictState<
	S extends State,
	Key extends keyof S,
	Getters extends GetRecord<any>,
	Setters extends SetRecord<any>,
>(privateState: Key[], mergedState: S, thisApi: StoreApi<S, Getters, Setters>) {
	return {
		api: thisApi.api,
		set: thisApi.set,
		use: privateState
			? Object.keys(thisApi.use).reduce(
					(acc, key) =>
						mergedState[key] && (privateState as string[]).includes(key)
							? acc
							: { ...acc, [key]: thisApi.use[key] },
					{}
				)
			: thisApi.use,
		get: privateState
			? () =>
					Object.entries(thisApi.get()).reduce(
						(acc, [key, val]) =>
							mergedState[key] && (privateState as string[]).includes(key)
								? acc
								: { ...acc, [key]: val },
						{}
					)
			: thisApi.get,
	}
}

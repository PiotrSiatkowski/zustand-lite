import { Empty, GetRecord, SetRecord, State, StoreApi, StoreApiEncapsulated } from '../types'

export function restrictState<
	T extends State,
	Key extends keyof T,
	Getters extends GetRecord<any> = Empty,
	Setters extends SetRecord<any> = Empty,
>(privateState: Key[], mergedState: T, thisApi: StoreApi<T, Getters, Setters>) {
	return {
		api: thisApi.api,
		set: thisApi.set,
		use: thisApi.use,
		get: Object.keys(thisApi.get).reduce(
			(acc, key) =>
				mergedState[key] && (privateState as string[]).includes(key)
					? acc
					: { ...acc, [key]: thisApi.get[key] },
			{}
		) as GetRecord<Omit<T, Key>> & Getters,
	} as StoreApiEncapsulated<Omit<T, Key>, Getters, Setters>
}

/**
 * Returns the same own enumerable keys that object spread would copy, including symbols.
 */
export function ownEnumerableKeys(value: object): PropertyKey[] {
	return [
		...Object.keys(value),
		...Object.getOwnPropertySymbols(value).filter(
			(symbol) => Object.getOwnPropertyDescriptor(value, symbol)?.enumerable
		),
	]
}

export function defineEnumerableValue(target: object, key: PropertyKey, value: unknown): void {
	// defineProperty can safely shadow function-owned keys such as `name` and `length`.
	Object.defineProperty(target, key, {
		configurable: true,
		enumerable: true,
		value,
		writable: true,
	})
}

export function assignEnumerableProperties<T extends object, A extends object>(
	target: T,
	source: A
): T & A
export function assignEnumerableProperties<T extends object, A extends object, B extends object>(
	target: T,
	sourceA: A,
	sourceB: B
): T & A & B
export function assignEnumerableProperties(target: object, ...sources: object[]): any {
	for (const source of sources) {
		for (const key of ownEnumerableKeys(source)) {
			defineEnumerableValue(target, key, (source as Record<PropertyKey, unknown>)[key])
		}
	}

	return target
}

export function assertPlainState(stateValue: object, stateLabel: string): void {
	if (!isPlainObject(stateValue)) {
		throw new TypeError(`${stateLabel} must be a plain object`)
	}

	// Object spread treats this key safely, but downstream consumers may still assign it.
	if (Object.prototype.hasOwnProperty.call(stateValue, '__proto__')) {
		throw new TypeError(`${stateLabel} cannot contain a "__proto__" key`)
	}
}

export function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false
	}

	const prototype = Object.getPrototypeOf(value)
	const baseProto = prototype === null ? null : Object.getPrototypeOf(prototype)

	// The second check accepts ordinary objects created in another JavaScript realm.
	return prototype === null || baseProto === null
}

export function isPromiseLike(candidate: unknown): candidate is PromiseLike<unknown> {
	return (
		(typeof candidate === 'object' || typeof candidate === 'function') &&
		candidate !== null &&
		typeof (candidate as PromiseLike<unknown>).then === 'function'
	)
}

import { shallow } from 'zustand/shallow'
import { ownEnumerableKeys } from './object'

/**
 * Compares values for no-op state updates without treating distinct opaque
 * objects (such as Date, RegExp, or class instances) as equal.
 */
export function isShallowEqualValue(firstValue: unknown, otherValue: unknown) {
	if (Object.is(firstValue, otherValue)) {
		return true
	}

	if (!isObject(firstValue) || !isObject(otherValue)) {
		return false
	}

	const firstProto = Object.getPrototypeOf(firstValue)
	const otherProto = Object.getPrototypeOf(otherValue)

	if (firstProto !== otherProto) {
		return false
	}

	const plainPair = firstProto === Object.prototype || firstProto === null
	const knownPair =
		Array.isArray(firstValue) || firstValue instanceof Map || firstValue instanceof Set

	return plainPair
		? shallowRecord(firstValue, otherValue)
		: knownPair && shallow(firstValue, otherValue)
}

export function shallowRecord(firstValue: object, otherValue: object) {
	const firstKeys = ownEnumerableKeys(firstValue)
	const otherKeys = ownEnumerableKeys(otherValue)

	return (
		firstKeys.length === otherKeys.length &&
		firstKeys.every(
			(key) =>
				Object.prototype.hasOwnProperty.call(otherValue, key) &&
				Object.is(
					(firstValue as Record<PropertyKey, unknown>)[key],
					(otherValue as Record<PropertyKey, unknown>)[key]
				)
		)
	)
}

function isObject(candidate: unknown): candidate is object {
	return typeof candidate === 'object' && candidate !== null
}

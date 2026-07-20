import { defineEnumerableValue } from './object'

export const identity = (value: any) => value

export const pick = (sourceObject: object, selectedKeys: PropertyKey[]) =>
	selectedKeys.reduce<Record<PropertyKey, any>>((pickedState, selectedKey) => {
		if (selectedKey in sourceObject) {
			defineEnumerableValue(
				pickedState,
				selectedKey,
				(sourceObject as Record<PropertyKey, any>)[selectedKey]
			)
		}

		return pickedState
	}, {})

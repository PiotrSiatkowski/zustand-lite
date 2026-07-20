import { BrandedUseGetterOptions, UseGetterOptions } from '../types'
import { getterOptionsMarker } from '../utils/optionsMarker'

export function withOptions<R>(options: UseGetterOptions<R>): BrandedUseGetterOptions<R> {
	// A symbol brand distinguishes hook options from ordinary getter arguments at runtime.
	return { ...options, [getterOptionsMarker]: true }
}

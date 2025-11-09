import ErrorStackParser from 'error-stack-parser'

/**
 * Hacky, but working (and possibly only one there is) method of fetching proper caller
 * name of the extended function.
 */
export function generateSetterName() {
	// Proper setter name should hide at 2nd position in the normalized stack.
	const stack = ErrorStackParser.parse(new Error())
	const index = stack.findIndex((entry) => entry.functionName?.includes('_zustandLiteInferName_'))
	return index - 1 >= 0 ? stack[index - 1].functionName : null
}

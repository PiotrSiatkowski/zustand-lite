import ErrorStackParser from 'error-stack-parser'

/**
 * Infers a custom setter's name from the normalized call stack.
 *
 * Custom setters use a sentinel function name so the immediately preceding frame can be
 * reported to devtools without requiring users to repeat an action name manually.
 */
export function generateSetterName() {
	const frames = ErrorStackParser.parse(new Error())
	const marker = frames.findIndex((entry) =>
		entry.functionName?.includes('_zustandLiteInferName_')
	)

	return marker > 0 ? frames[marker - 1].functionName : null
}

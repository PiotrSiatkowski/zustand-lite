import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Record<
	string,
	any
>
const readme = readFileSync(resolve(root, 'README.md'), 'utf8')

describe('Published package contract', () => {
	test('declares React as a peer dependency', () => {
		expect(packageJson.peerDependencies?.react).toBeDefined()
	})

	test('ships internal state dependencies as runtime dependencies', () => {
		expect(packageJson.dependencies?.['use-sync-external-store']).toBeDefined()
		expect(packageJson.dependencies?.zustand).toBeDefined()
	})

	test('builds and tests automatically before packing', () => {
		expect(packageJson.scripts?.prepack).toContain('build')
		expect(packageJson.scripts?.build).toContain('test:dist')
	})

	test('routes CommonJS consumers to CommonJS declarations', () => {
		expect(packageJson.exports?.['.']?.require?.types).toBe('./dist/index.d.cts')
	})

	test('references only README images that exist', () => {
		const relativeImages = [...readme.matchAll(/!\[[^\]]*\]\((?!https?:)([^)]+)\)/g)]
			.map((match) => match[1])
			.filter((path) => !path.startsWith('data:'))

		for (const image of relativeImages) {
			expect(existsSync(resolve(root, image))).toBe(true)
			expect(packageJson.files).toContain(image.replace(/^\.\//, ''))
		}
	})

	test('documents every exported runtime helper', () => {
		expect(readme).toContain('setGlobalConfig')
		expect(readme).toContain('withOptions')
		expect(readme).toContain('withReset')
	})

	test('does not document a non-existent previousGetter helper', () => {
		expect(readme).not.toContain('get.previousGetter()')
	})
})

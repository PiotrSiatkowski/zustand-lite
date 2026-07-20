import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToString } from 'react-dom/server'

import { createStore, withOptions, withReset } from 'zustand-lite'

const store = createStore({ count: 1 }).composePlugin(withReset).extendByState({ extra: 2 })

assert.deepEqual(store.api.getInitialState(), { count: 1, extra: 2 })

store.set.count(3)
store.set.extra(4)
store.set.reset()

assert.deepEqual(store.get(), { count: 1, extra: 2 })
assert.equal(typeof withOptions({ eq: Object.is }).eq, 'function')

const commonJs = createRequire(import.meta.url)('zustand-lite')
const crossModuleStore = createStore({ value: 1 }).extendGetters(() => ({
	argumentCount: function (_value) {
		return arguments.length
	},
}))
const commonJsOptions = commonJs.withOptions({ eq: Object.is })
const html = renderToString(
	React.createElement(() =>
		React.createElement('div', null, crossModuleStore.use.argumentCount(1, commonJsOptions))
	)
)
assert.equal(html, '<div>1</div>')

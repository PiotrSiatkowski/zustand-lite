import zustandLite = require('zustand-lite')

const store = zustandLite.createStore({ count: 0 })
const options = zustandLite.withOptions<number>({ eq: Object.is })

store.set.count(1)
store.api.getState().count
options.eq(1, 1)

import { Provider } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const emitter = Provider.createEmitter()

  expect(emitter).toMatchInlineSnapshot(`
    {
      "addListener": [Function],
      "emit": [Function],
      "eventNames": [Function],
      "listenerCount": [Function],
      "listeners": [Function],
      "off": [Function],
      "on": [Function],
      "once": [Function],
      "removeAllListeners": [Function],
      "removeListener": [Function],
    }
  `)
})

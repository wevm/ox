import { expect, test } from 'vitest'
import * as exports from './AbiEvent.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "EventDataMismatchError",
      "EventSelectorTopicMismatchError",
      "EventTopicsMismatchError",
      "FilterTypeNotSupportedError",
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})

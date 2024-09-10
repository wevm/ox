import { expect, test } from 'vitest'
import * as exports from './AbiEvent.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "DataMismatchError",
      "FilterTypeNotSupportedError",
      "InputNotFoundError",
      "SelectorTopicMismatchError",
      "TopicsMismatchError",
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})

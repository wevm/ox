import { expect, test } from 'vitest'
import * as exports from './AbiEvent.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "ArgsMismatchError",
      "DataMismatchError",
      "FilterTypeNotSupportedError",
      "InputNotFoundError",
      "SelectorTopicMismatchError",
      "TopicsMismatchError",
      "assertArgs",
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})

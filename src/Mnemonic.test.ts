import { expect, test } from 'vitest'
import * as exports from './Mnemonic.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "random",
      "toSeed",
      "validate",
      "czech",
      "english",
      "french",
      "italian",
      "japanese",
      "korean",
      "portuguese",
      "simplifiedChinese",
      "spanish",
      "traditionalChinese",
    ]
  `)
})

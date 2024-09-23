import { expect, test } from 'vitest'
import * as exports from './Mnemonic.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "path",
      "random",
      "toHdKey",
      "toPrivateKey",
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

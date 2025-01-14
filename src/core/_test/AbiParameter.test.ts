import { AbiParameter } from 'ox'
import { describe, expect, test } from 'vitest'

describe('format', () => {
  test('default', () => {
    const formatted = AbiParameter.format({
      name: 'spender',
      type: 'address',
    })
    expect(formatted).toMatchInlineSnapshot(`"address spender"`)
  })
})

test('exports', () => {
  expect(Object.keys(AbiParameter)).toMatchInlineSnapshot(`
    [
      "format",
    ]
  `)
})

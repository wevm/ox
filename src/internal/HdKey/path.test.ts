import { HdKey } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const path = HdKey.path()
  expect(path).toMatchInlineSnapshot(`"m/44'/60'/0'/0/0"`)
})

test('options', () => {
  const path = HdKey.path({ account: 1, change: 2, index: 3 })
  expect(path).toMatchInlineSnapshot(`"m/44'/60'/1'/2/3"`)
})

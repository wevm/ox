import { Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.fromTuple([
      '0x01',
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    ]),
  ).toMatchInlineSnapshot(`
    {
      "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
      "yParity": 1,
    }
  `)

  expect(Signature.fromTuple(['0x', '0x', '0x'])).toMatchInlineSnapshot(`
    {
      "r": 0n,
      "s": 0n,
      "yParity": 0,
    }
  `)
})

test('error: invalid sig', () => {
  expect(() =>
    Signature.fromTuple([
      '0x01',
      '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf88',
      '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    ]),
  ).toThrowErrorMatchingInlineSnapshot(
    '[InvalidSignatureRError: Value `12744384857206398515154870451201165412972984067701483231091796422377075355598728` is an invalid r value. r must be a positive integer less than 2^256.]',
  )
})

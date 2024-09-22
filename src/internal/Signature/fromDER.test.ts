import { expect, test } from 'vitest'
import { Signature } from 'ox'

test('default', () => {
  expect(
    Signature.fromDER(
      '0x304402206e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf02204a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    ),
  ).toMatchInlineSnapshot(
    `
    {
      "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
      "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    }
  `,
  )
})

test('behavior: bytes', () => {
  const signature = Signature.from({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  })
  const signature_der = Signature.toDER(signature, { as: 'Bytes' })
  expect(Signature.fromDER(signature_der)).toEqual(signature)
})

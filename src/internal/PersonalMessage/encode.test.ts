import { Bytes, Hex, PersonalMessage } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(PersonalMessage.encode(Hex.from('hello world'))).toMatchInlineSnapshot(
    `"0x19457468657265756d205369676e6564204d6573736167653a0a313168656c6c6f20776f726c64"`,
  )
  expect(
    PersonalMessage.encode(Bytes.from('hello world')),
  ).toMatchInlineSnapshot(
    `"0x19457468657265756d205369676e6564204d6573736167653a0a313168656c6c6f20776f726c64"`,
  )
})

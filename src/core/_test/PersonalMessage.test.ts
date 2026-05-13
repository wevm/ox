import { Bytes, Hex, PersonalMessage, Secp256k1 } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('encode', () => {
  test('default', () => {
    expect(
      PersonalMessage.encode(Hex.fromString('hello world')),
    ).toMatchInlineSnapshot(
      `"0x19457468657265756d205369676e6564204d6573736167653a0a313168656c6c6f20776f726c64"`,
    )
    expect(
      PersonalMessage.encode(Bytes.fromString('hello world')),
    ).toMatchInlineSnapshot(
      `"0x19457468657265756d205369676e6564204d6573736167653a0a313168656c6c6f20776f726c64"`,
    )
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      PersonalMessage.getSignPayload(Hex.fromString('hello world')),
    ).toMatchInlineSnapshot(
      `"0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68"`,
    )
  })

  test('behavior: signature', () => {
    const payload = PersonalMessage.getSignPayload(
      Hex.fromString('hello world'),
    )

    const signature = Secp256k1.sign({
      payload,
      privateKey: accounts[0].privateKey,
    })

    expect(signature).toMatchInlineSnapshot(`
      {
        "r": "0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf1",
        "s": "0x5fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b",
        "yParity": 0,
      }
    `)
  })
})

test('exports', () => {
  expect(Object.keys(PersonalMessage)).toMatchInlineSnapshot(`
    [
      "encode",
      "getSignPayload",
    ]
  `)
})

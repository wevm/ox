import { Bytes, P256 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

const privateKey =
  '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'

test('default', () => {
  {
    const publicKey = P256.getPublicKey({
      privateKey,
    })

    expect(publicKey).toMatchInlineSnapshot(
      `"0x041753ed8e23fd6e17922ebdeed8ebe8043e34cd10118271cf2acdee88c1d58307c3357f052ea5e9a67625fa723ca0e7bc8ce9d069bea5b8b397137f991284b68c"`,
    )
  }

  {
    const publicKey = P256.getPublicKey({
      privateKey: Bytes.from(accounts[0].privateKey),
    })

    expect(publicKey).toMatchInlineSnapshot(
      `"0x04a43b66d1eaee03f07d64920491f8b3487a90f527f2342c8caccd55d5065084496c57d409d6db06faefd8a0aa1106acd69501134e11cf74b2e95c81b451da3433"`,
    )
  }
})

test('args: as', () => {
  const publicKey = P256.getPublicKey({
    privateKey,
    as: 'Bytes',
  })

  expect(publicKey).toMatchInlineSnapshot(
    `
    Uint8Array [
      4,
      23,
      83,
      237,
      142,
      35,
      253,
      110,
      23,
      146,
      46,
      189,
      238,
      216,
      235,
      232,
      4,
      62,
      52,
      205,
      16,
      17,
      130,
      113,
      207,
      42,
      205,
      238,
      136,
      193,
      213,
      131,
      7,
      195,
      53,
      127,
      5,
      46,
      165,
      233,
      166,
      118,
      37,
      250,
      114,
      60,
      160,
      231,
      188,
      140,
      233,
      208,
      105,
      190,
      165,
      184,
      179,
      151,
      19,
      127,
      153,
      18,
      132,
      182,
      140,
    ]
  `,
  )
})

import { Address, Bytes, Secp256k1 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

test('default', () => {
  {
    const publicKey = Secp256k1.getPublicKey({
      privateKey: accounts[0].privateKey,
    })

    expect(publicKey).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
    expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
      accounts[0].address,
    )
  }

  {
    const publicKey = Secp256k1.getPublicKey({
      privateKey: Bytes.from(accounts[0].privateKey),
    })

    expect(publicKey).toMatchInlineSnapshot(
      `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
    )
    expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
      accounts[0].address,
    )
  }
})

test('args: compressed', () => {
  const publicKey = Secp256k1.getPublicKey({
    privateKey: accounts[0].privateKey,
    compressed: true,
  })

  expect(publicKey).toMatchInlineSnapshot(
    `"0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75"`,
  )
})

test('args: as', () => {
  const publicKey = Secp256k1.getPublicKey({
    privateKey: accounts[0].privateKey,
    as: 'Bytes',
  })

  expect(publicKey).toMatchInlineSnapshot(
    `
    Uint8Array [
      4,
      131,
      24,
      83,
      91,
      84,
      16,
      93,
      74,
      122,
      174,
      96,
      192,
      143,
      196,
      95,
      150,
      135,
      24,
      27,
      79,
      223,
      198,
      37,
      189,
      26,
      117,
      63,
      167,
      57,
      127,
      237,
      117,
      53,
      71,
      241,
      28,
      168,
      105,
      102,
      70,
      242,
      243,
      172,
      176,
      142,
      49,
      1,
      106,
      250,
      194,
      62,
      99,
      12,
      93,
      17,
      245,
      159,
      97,
      254,
      245,
      123,
      13,
      42,
      165,
    ]
  `,
  )
  expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
    accounts[0].address,
  )
})

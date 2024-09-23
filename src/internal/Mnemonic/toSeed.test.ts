import { expect, test } from 'vitest'
import { Mnemonic } from 'ox'

const mnemonic =
  'buyer zoo end danger ice capable shrug naive twist relief mass bonus'

test('default', () => {
  expect(Mnemonic.toSeed(mnemonic)).toMatchInlineSnapshot(`
    Uint8Array [
      8,
      147,
      69,
      25,
      237,
      18,
      53,
      60,
      175,
      72,
      79,
      138,
      23,
      228,
      195,
      171,
      103,
      106,
      95,
      197,
      252,
      176,
      71,
      236,
      31,
      249,
      24,
      248,
      58,
      229,
      138,
      41,
      71,
      198,
      129,
      77,
      149,
      249,
      46,
      182,
      135,
      217,
      196,
      58,
      113,
      173,
      129,
      38,
      188,
      124,
      193,
      229,
      82,
      248,
      173,
      249,
      109,
      120,
      112,
      64,
      80,
      199,
      16,
      222,
    ]
  `)
})

test('options: as', () => {
  expect(Mnemonic.toSeed(mnemonic, { as: 'Hex' })).toMatchInlineSnapshot(`"0x08934519ed12353caf484f8a17e4c3ab676a5fc5fcb047ec1ff918f83ae58a2947c6814d95f92eb687d9c43a71ad8126bc7cc1e552f8adf96d78704050c710de"`)
})

test('options: passphrase', () => {
  expect(
    Mnemonic.toSeed(mnemonic, { passphrase: 'qwerty' }),
  ).toMatchInlineSnapshot(`
    Uint8Array [
      64,
      108,
      165,
      12,
      109,
      126,
      152,
      1,
      80,
      8,
      203,
      241,
      216,
      111,
      106,
      109,
      78,
      52,
      108,
      69,
      105,
      71,
      171,
      117,
      238,
      161,
      154,
      8,
      150,
      115,
      117,
      36,
      130,
      174,
      230,
      149,
      137,
      86,
      207,
      89,
      84,
      204,
      60,
      227,
      123,
      174,
      79,
      159,
      69,
      88,
      244,
      72,
      95,
      67,
      188,
      79,
      146,
      241,
      247,
      101,
      157,
      194,
      248,
      124,
    ]
  `)
})
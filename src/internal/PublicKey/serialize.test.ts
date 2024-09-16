import { PublicKey } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const publicKey = PublicKey.from({
    x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
  })
  const serialized = PublicKey.serialize(publicKey)
  expect(serialized).toMatchInlineSnapshot(
    `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
  )
})

test('behavior: prefix', () => {
  const publicKey = PublicKey.from({
    prefix: 4,
    x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
  })
  const serialized = PublicKey.serialize(publicKey)
  expect(serialized).toMatchInlineSnapshot(
    `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
  )
})

test('behavior: compressed', () => {
  const publicKey = PublicKey.from({
    prefix: 3,
    x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
  })
  const serialized = PublicKey.serialize(publicKey)
  expect(serialized).toMatchInlineSnapshot(
    `"0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75"`,
  )
})

test('option: as', () => {
  const publicKey = PublicKey.from({
    x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
  })
  const serialized = PublicKey.serialize(publicKey, { as: 'Bytes' })
  expect(serialized).toMatchInlineSnapshot(
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
})

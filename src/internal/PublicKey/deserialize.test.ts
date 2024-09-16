import { Bytes, PublicKey } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const serialized =
    '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
  const publicKey = PublicKey.deserialize(serialized)
  expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 4,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
})

test('behavior: prefix', () => {
  const serialized =
    '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5'
  const publicKey = PublicKey.deserialize(serialized)
  expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 4,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
})

test('behavior: compressed', () => {
  const serialized =
    '0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75'
  const publicKey = PublicKey.deserialize(serialized)
  expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 3,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
    }
  `)
})

test('behavior: bytes', () => {
  const serialized = Bytes.from(
    '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
  )
  const publicKey = PublicKey.deserialize(serialized)
  expect(publicKey).toMatchInlineSnapshot(`
    {
      "prefix": 4,
      "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
      "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
    }
  `)
})

test('error: invalid size', () => {
  expect(() =>
    PublicKey.deserialize(
      '0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2a',
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [PublicKey.InvalidSerializedSizeError: Value \`0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2a\` is an invalid public key size.

    Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).
    Received 63 bytes.]
  `)
})

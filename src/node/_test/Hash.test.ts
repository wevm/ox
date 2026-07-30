import { Hash as CoreHash, Hex } from 'ox'
import { Hash } from 'ox/node'
import { describe, expect, test } from 'vp/test'

describe('engine', () => {
  test('behavior: exposes the supported primitives', async () => {
    const engine = await Hash.engine()

    expect(Object.keys(engine).sort()).toMatchInlineSnapshot(`
      [
        "createRipemd160",
        "createSha256",
        "hmacSha256",
        "ripemd160",
        "sha256",
      ]
    `)
  })

  test('behavior: matches published empty-input vectors', async () => {
    const { hmacSha256, ripemd160, sha256 } = await Hash.engine()
    const empty = new Uint8Array()

    expect(Hex.fromBytes(sha256(empty))).toMatchInlineSnapshot(
      `"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`,
    )
    expect(Hex.fromBytes(ripemd160(empty))).toMatchInlineSnapshot(
      `"0x9c1185a5c5e9fc54612808977ee8f548b2258d31"`,
    )
    expect(Hex.fromBytes(hmacSha256(empty, empty))).toMatchInlineSnapshot(
      `"0xb613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad"`,
    )
  })

  test('behavior: agrees with the default across block boundaries', async () => {
    const node = await Hash.engine()

    for (const size of [0, 1, 55, 56, 63, 64, 65, 127, 128, 129]) {
      const input = Uint8Array.from({ length: size }, (_, index) => index % 251)
      expect(node.sha256(input)).toEqual(
        CoreHash.sha256(input, { as: 'Bytes' }),
      )
      expect(node.ripemd160(input)).toEqual(
        CoreHash.ripemd160(input, { as: 'Bytes' }),
      )
    }
  })

  test('behavior: agrees with the default across HMAC key sizes', async () => {
    const { hmacSha256 } = await Hash.engine()
    const message = Uint8Array.from({ length: 65 }, (_, index) => index % 251)

    for (const size of [0, 1, 32, 63, 64, 65, 200]) {
      const key = Uint8Array.from({ length: size }, (_, index) => index % 239)
      expect(hmacSha256(key, message)).toEqual(
        CoreHash.hmac256(key, message, { as: 'Bytes' }),
      )
    }
  })

  test('behavior: respects typed-array offsets', async () => {
    const node = await Hash.engine()
    const input = Uint8Array.from(
      { length: 80 },
      (_, index) => (index * 17) % 251,
    ).subarray(7, 71)
    const key = Uint8Array.from(
      { length: 48 },
      (_, index) => (index * 29) % 239,
    ).subarray(5, 37)

    expect(node.sha256(input)).toEqual(CoreHash.sha256(input, { as: 'Bytes' }))
    expect(node.ripemd160(input)).toEqual(
      CoreHash.ripemd160(input, { as: 'Bytes' }),
    )
    expect(node.hmacSha256(key, input)).toEqual(
      CoreHash.hmac256(key, input, { as: 'Bytes' }),
    )
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await Hash.engine()
    const second = await Hash.engine()

    expect(first === second).toMatchInlineSnapshot('false')
  })

  test('behavior: returns owned Uint8Array values', async () => {
    const { hmacSha256, ripemd160, sha256 } = await Hash.engine()
    const input = Uint8Array.of(1, 2, 3)
    const outputs = [hmacSha256(input, input), ripemd160(input), sha256(input)]

    expect(outputs.map((output) => output.constructor === Uint8Array))
      .toMatchInlineSnapshot(`
      [
        true,
        true,
        true,
      ]
    `)
    expect(sha256(input) === sha256(input)).toMatchInlineSnapshot('false')
  })

  test('behavior: incremental states support chunking and cloning', async () => {
    const { createRipemd160, createSha256 } = await Hash.engine()

    for (const [create, digest, size] of [
      [createRipemd160, CoreHash.ripemd160, 20],
      [createSha256, CoreHash.sha256, 32],
    ] as const) {
      const first = create()
      first.update(Uint8Array.of(0xde, 0xad))
      const second = first.clone()
      first.update(Uint8Array.of(0xbe, 0xef))
      second.update(Uint8Array.of(0xca, 0xfe))

      const firstOutput = new Uint8Array(size)
      const secondOutput = new Uint8Array(size)
      first.digestInto(firstOutput)
      second.digestInto(secondOutput)

      expect(firstOutput).toEqual(digest('0xdeadbeef', { as: 'Bytes' }))
      expect(secondOutput).toEqual(digest('0xdeadcafe', { as: 'Bytes' }))
    }
  })

  test('behavior: incremental states enforce lifecycle and output bounds', async () => {
    const { createSha256 } = await Hash.engine()
    const hash = createSha256()
    hash.update(Uint8Array.of(0xde, 0xad))

    expect(() => hash.digestInto(new Uint8Array(31))).toThrowError(
      Hash.InvalidDigestSizeError,
    )

    const output = new Uint8Array(34).fill(0xff)
    hash.digestInto(output)
    expect(output.slice(32)).toEqual(Uint8Array.of(0xff, 0xff))
    expect(() => hash.update(new Uint8Array())).toThrowError(
      Hash.HasherDestroyedError,
    )
    expect(() => {
      hash.destroy()
      hash.destroy()
    }).not.toThrow()
  })
})

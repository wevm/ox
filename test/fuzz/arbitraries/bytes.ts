import { fc } from '@fast-check/vitest'
import type { Hex } from 'ox'

/**
 * Arbitrary 0x-prefixed lowercase hex string of `byteLength` bytes.
 *
 * Generates exact-width hex (no odd-nibble padding). Use this when the consumer
 * needs canonical even-nibble hex (e.g. ABI/RLP byte fields).
 */
export function arbitraryHexOfByteLength(
  byteLength: number,
): fc.Arbitrary<Hex.Hex> {
  return fc
    .uint8Array({ minLength: byteLength, maxLength: byteLength })
    .map((bytes) => {
      let s = '0x'
      for (let i = 0; i < bytes.length; i++)
        s += (bytes[i]! < 0x10 ? '0' : '') + bytes[i]!.toString(16)
      return s as Hex.Hex
    })
}

/**
 * Arbitrary 0x-prefixed hex string of variable byte length, capped to
 * `maxByteLength`. Defaults to 128 bytes to keep parser fuzz inputs bounded.
 */
export function arbitraryHex(maxByteLength = 128): fc.Arbitrary<Hex.Hex> {
  const boundaries = [0, 1, 31, 32, 33, 63, 64, 65, maxByteLength].filter(
    (length, i, lengths) =>
      length <= maxByteLength && lengths.indexOf(length) === i,
  )
  return fc.oneof(
    {
      weight: 4,
      arbitrary: fc
        .integer({ min: 0, max: maxByteLength })
        .chain(arbitraryHexOfByteLength),
    },
    {
      weight: 1,
      arbitrary: fc.constantFrom(...boundaries).chain(arbitraryHexOfByteLength),
    },
  )
}

/**
 * Arbitrary checksum-eligible 20-byte address, returned as lowercase
 * `0x`-prefixed hex. Callers that need a checksummed string can pass the result
 * through `Address.checksum`.
 */
export function arbitraryAddressHex(): fc.Arbitrary<Hex.Hex> {
  return arbitraryHexOfByteLength(20)
}

/**
 * Arbitrary `bigint` that fits in a Solidity `int<bits>` / `uint<bits>`.
 * Bounded by the type's representable range.
 */
export function arbitraryBigIntInBits(
  bits: number,
  signed: boolean,
): fc.Arbitrary<bigint> {
  const max = signed ? 2n ** (BigInt(bits) - 1n) - 1n : 2n ** BigInt(bits) - 1n
  const min = signed ? -(2n ** (BigInt(bits) - 1n)) : 0n
  const boundaries = [min, max, 0n, 1n, -1n, 2n ** 64n - 1n, 2n ** 64n].filter(
    (value) => value >= min && value <= max,
  )
  return fc.oneof(
    { weight: 4, arbitrary: fc.bigInt({ min, max }) },
    { weight: 1, arbitrary: fc.constantFrom(...boundaries) },
  )
}

/**
 * Arbitrary `Uint8Array` of variable length, capped to `maxLength`. Defaults to
 * 128 bytes to keep parser fuzz inputs bounded.
 */
export function arbitraryBytes(maxLength = 128): fc.Arbitrary<Uint8Array> {
  return fc.uint8Array({ minLength: 0, maxLength })
}

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
  return fc
    .integer({ min: 0, max: maxByteLength })
    .chain(arbitraryHexOfByteLength)
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
  if (signed) {
    const max = 2n ** (BigInt(bits) - 1n) - 1n
    const min = -(2n ** (BigInt(bits) - 1n))
    return fc.bigInt({ min, max })
  }
  const max = 2n ** BigInt(bits) - 1n
  return fc.bigInt({ min: 0n, max })
}

/**
 * Arbitrary `Uint8Array` of variable length, capped to `maxLength`. Defaults to
 * 128 bytes to keep parser fuzz inputs bounded.
 */
export function arbitraryBytes(maxLength = 128): fc.Arbitrary<Uint8Array> {
  return fc.uint8Array({ minLength: 0, maxLength })
}

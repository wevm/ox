import { Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import {
  bytesToHex,
  bytesToHexLoop,
  hexToBytes,
  hexToBytesLoop,
} from '../hex.js'

// The dispatched `bytesToHex` / `hexToBytes` pick a native method or `Buffer`
// when the runtime offers one, so the JS loops underneath them are unreachable
// on Node. They back every browser without `Uint8Array.prototype.toHex`, so
// they are exercised directly here rather than left to whichever tier the test
// runtime happens to take.

const sizes = [0, 1, 2, 19, 20, 31, 32, 33, 48, 64, 127, 128, 1024]

describe('bytesToHexLoop', () => {
  test('agrees with the dispatched encoder at every size', () => {
    for (const size of sizes) {
      const value = Bytes.random(size)
      expect(bytesToHexLoop(value)).toBe(bytesToHex(value))
    }
  })

  test('behavior: empty input', () => {
    expect(bytesToHexLoop(new Uint8Array(0))).toMatchInlineSnapshot(`"0x"`)
  })

  test('behavior: pads each byte to two nibbles', () => {
    expect(
      bytesToHexLoop(Uint8Array.of(0, 1, 15, 16, 255)),
    ).toMatchInlineSnapshot(`"0x00010f10ff"`)
  })

  test('behavior: reads through a subarray offset', () => {
    const backing = Uint8Array.of(0xde, 0xad, 0xbe, 0xef)
    expect(bytesToHexLoop(backing.subarray(1, 3))).toMatchInlineSnapshot(
      `"0xadbe"`,
    )
  })
})

describe('hexToBytesLoop', () => {
  test('agrees with the dispatched decoder at every size', () => {
    for (const size of sizes) {
      const hex = Hex.fromBytes(Bytes.random(size))
      expect(hexToBytesLoop(hex, size)).toEqual(hexToBytes(hex))
    }
  })

  test('behavior: empty input', () => {
    expect(hexToBytesLoop('0x', 0)).toMatchInlineSnapshot(`Uint8Array []`)
  })

  test('behavior: accepts uppercase nibbles', () => {
    expect(hexToBytesLoop('0xDEADBEEF', 4)).toEqual(hexToBytes('0xdeadbeef'))
  })

  test('error: invalid character in the high nibble', () => {
    expect(() => hexToBytesLoop('0xzz', 1)).toThrowErrorMatchingInlineSnapshot(
      `
      [Hex.InvalidHexValueError: Value \`0xzz\` is an invalid hex value.

      Hex values must start with \`"0x"\` and contain only hexadecimal characters (0-9, a-f, A-F).]
    `,
    )
  })

  test('error: invalid character in the low nibble', () => {
    expect(() => hexToBytesLoop('0x0g', 1)).toThrowError(
      Hex.InvalidHexValueError,
    )
  })

  test('error: invalid character in a trailing byte', () => {
    // The sentinel is accumulated across the loop, so a late bad nibble must
    // still be caught rather than masked by the valid ones before it.
    expect(() => hexToBytesLoop('0xdeadbe$f', 4)).toThrowError(
      Hex.InvalidHexValueError,
    )
  })

  test('error: characters beyond Latin-1', () => {
    // These index past `nibbleTable`, so they read `undefined` rather than the
    // sentinel; unmapped, they would OR in as zero and decode to `0x00`.
    for (const value of ['0x€€', '0xĀĀ', '0xǰ0'])
      expect(() => hexToBytesLoop(value, 1)).toThrowError(
        Hex.InvalidHexValueError,
      )
  })
})

describe('hexToBytes', () => {
  // `loopDecodeMaxBytes` is 32; both sides of it must behave identically.
  test('behavior: matches across the loop/Buffer threshold', () => {
    for (const size of [31, 32, 33, 34]) {
      const bytes = Bytes.random(size)
      expect(hexToBytes(Hex.fromBytes(bytes))).toEqual(bytes)
    }
  })

  test('error: invalid character above the threshold', () => {
    const hex = `0x${'ab'.repeat(40)}zz` as const
    expect(() => hexToBytes(hex)).toThrowError(Hex.InvalidHexValueError)
  })

  test('error: odd length', () => {
    expect(() => hexToBytes('0xabc')).toThrowError(Hex.InvalidLengthError)
  })

  test('error: characters beyond Latin-1, both sides of the threshold', () => {
    for (const value of ['0x€€', `0x${'ab'.repeat(40)}€€`])
      expect(() => hexToBytes(value)).toThrowError(Hex.InvalidHexValueError)
  })

  test('behavior: result does not alias a pooled buffer', () => {
    // Above the threshold the decoder goes through `Buffer`, which allocates
    // from a shared pool; the returned bytes must own their backing store.
    const bytes = hexToBytes(Hex.fromBytes(Bytes.random(64)))
    expect(bytes.byteOffset).toBe(0)
    expect(bytes.buffer.byteLength).toBe(64)
  })
})

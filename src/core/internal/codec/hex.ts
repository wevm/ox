import * as Errors from '../../Errors.js'

/** @internal */
export type Hex = `0x${string}`

/** @internal */
const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

// Char-code → 4-bit nibble lookup table. Sentinel `0xff` = invalid.
const nibbleTable = /*#__PURE__*/ (() => {
  const table = new Uint8Array(256).fill(0xff)
  for (let i = 0; i < 10; i++) table[48 + i] = i // '0'-'9'
  for (let i = 0; i < 6; i++) {
    table[65 + i] = 10 + i // 'A'-'F'
    table[97 + i] = 10 + i // 'a'-'f'
  }
  return table
})()

// Native fast-path detection. `Uint8Array.prototype.toHex` ships in Chromium
// 145, Safari 18.2+ and Firefox 133+, but not in Node 24, which reaches
// `Buffer` instead.
//
// Only *encoding* delegates to it. Encoding is total, so a native method has
// nothing to get wrong; decoding has to reject, and the native decoders do not
// do so reliably -- Chromium 145 reads U+C230 as the digit `0`, masking the
// code unit to 8 bits exactly as `Buffer` does, and only rejects it from 149
// on. test262 misses this because none of its illegal characters mask onto the
// hex alphabet. Guarding `fromHex` costs an ASCII scan that leaves it only
// 10-25% ahead of the loop, so it is not used at all.
const _Buffer: typeof globalThis.Buffer | undefined = (
  globalThis as typeof globalThis & { Buffer?: typeof globalThis.Buffer }
).Buffer
const nativeToHex: ((this: Uint8Array) => string) | undefined = (
  Uint8Array.prototype as Uint8Array & { toHex?: () => string }
).toHex

/**
 * Byte count below which {@link hexToBytesLoop} beats `Buffer.from(…, 'hex')`,
 * whose fixed per-call cost short inputs cannot amortize. Measured on Node 24
 * (V8 13.6): the crossover sits between 32 and 48 bytes, and 32 covers the
 * sizes Ethereum work is made of -- 20-byte addresses and 32-byte words.
 *
 * `Buffer` is the only tier this applies to; where it is absent the loop
 * decodes at every size. Re-measure before moving it.
 *
 * @internal
 */
const loopDecodeMaxBytes = 32

/**
 * Encodes a `Uint8Array` into a `0x`-prefixed lowercase hex string. Uses the
 * native `Uint8Array.prototype.toHex` or Node's `Buffer` when available;
 * otherwise a tight JS loop.
 *
 * @internal
 */
export function bytesToHex(value: Uint8Array): Hex {
  if (bytesToHexNative) return bytesToHexNative(value)
  if (bytesToHexBuffer) return bytesToHexBuffer(value)
  return bytesToHexLoop(value)
}

/**
 * Encodes via `Uint8Array.prototype.toHex`, where the runtime has it.
 * `undefined` otherwise, so callers and the conformance suite can both ask
 * whether this tier exists rather than inferring it.
 *
 * @internal
 */
export const bytesToHexNative: ((value: Uint8Array) => Hex) | undefined =
  nativeToHex && ((value) => `0x${nativeToHex.call(value)}` as Hex)

/**
 * Encodes via Node's `Buffer`, where the runtime has it.
 *
 * @internal
 */
export const bytesToHexBuffer: ((value: Uint8Array) => Hex) | undefined =
  _Buffer &&
  ((value) =>
    `0x${_Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex')}` as Hex)

/**
 * Encodes in plain JavaScript, for runtimes with neither the native method nor
 * `Buffer`: browsers predating `Uint8Array.prototype.toHex`, which is recent
 * enough that a meaningful share of installed browsers still land here.
 *
 * Appending to a string beats collecting substrings and joining them: V8 builds
 * a rope and flattens it once, where `join` over an `Array.from({ length })`
 * pays for a holey array as well as the concatenation. Measured at ~6.5x on a
 * 32-byte input, counting the flatten.
 *
 * @internal
 */
export function bytesToHexLoop(value: Uint8Array): Hex {
  const length = value.length
  let hex = '0x'
  for (let i = 0; i < length; i++) hex += hexes[value[i]!]
  return hex as Hex
}

/**
 * Strictly decodes a `0x`-prefixed even-length hex string into a `Uint8Array`.
 * Uses a JS loop for short inputs and Node's `Buffer` for longer ones.
 *
 * @internal
 */
export function hexToBytes(value: string): Uint8Array {
  if (
    typeof value !== 'string' ||
    value.length < 2 ||
    value.charCodeAt(0) !== 48 /* '0' */ ||
    value.charCodeAt(1) !== 120 /* 'x' */
  )
    throw new InvalidHexValueError(value)
  const nibbles = value.length - 2
  if ((nibbles & 1) !== 0) throw new InvalidLengthError(value as Hex)
  const length = nibbles >> 1

  if (length <= loopDecodeMaxBytes) return hexToBytesLoop(value, length)
  if (hexToBytesBuffer) return hexToBytesBuffer(value, length)
  return hexToBytesLoop(value, length)
}

/**
 * Decodes via Node's `Buffer`, where the runtime has it.
 *
 * @internal
 */
export const hexToBytesBuffer:
  | ((value: string, length: number) => Uint8Array)
  | undefined =
  _Buffer &&
  ((value, length) => {
    const body = value.slice(2)
    // `Buffer.from(…, 'hex')` masks each UTF-16 code unit to 8 bits, so a
    // character above U+00FF can alias a hex digit: U+C230 masks to 0x30, the
    // digit `0`, and `'0x숰0'` decodes to `0x00` instead of being rejected.
    // Masking cannot fabricate a digit from pure ASCII, and a string is pure
    // ASCII exactly when its UTF-8 length matches its code-unit count.
    if (_Buffer.byteLength(body, 'utf8') !== body.length)
      throw new InvalidHexValueError(value)
    // Buffer.from with 'hex' silently truncates on invalid chars; verify
    // byteLength matches expectations to detect malformed input.
    const buf = _Buffer.from(body, 'hex')
    if (buf.length !== length) throw new InvalidHexValueError(value)
    // Copy out of Buffer pool: callers may rely on `.buffer` being a
    // standalone ArrayBuffer (e.g. WebAuthn attestationObject round-trips).
    const out = new Uint8Array(buf.byteLength)
    out.set(buf)
    return out
  })

/**
 * Decodes in plain JavaScript, reading nibbles straight out of `value` from
 * index 2 so no substring is materialized.
 *
 * Invalidity is accumulated rather than branched on per nibble: a valid nibble
 * is at most `0x0f`, so only the `0xff` sentinel can set bit 7, and one check
 * after the loop covers every character. `nibbleTable` only spans Latin-1, so a
 * code unit above it reads `undefined` and has to be mapped to the sentinel --
 * without that, a non-ASCII character would OR in as zero and decode silently.
 *
 * @internal
 */
export function hexToBytesLoop(value: string, length: number): Uint8Array {
  const out = new Uint8Array(length)
  let invalid = 0
  for (let i = 0, j = 2; i < length; i++) {
    const hi = nibbleTable[value.charCodeAt(j++)] ?? 0xff
    const lo = nibbleTable[value.charCodeAt(j++)] ?? 0xff
    invalid |= hi | lo
    out[i] = (hi << 4) | lo
  }
  if (invalid & 0x80) throw new InvalidHexValueError(value)
  return out
}

/** @internal */
export function charCodeToBase16(char: number): number | undefined {
  const v = nibbleTable[char] ?? 0xff
  return v === 0xff ? undefined : v
}

/** Thrown when a value is not a valid `0x`-prefixed hex string. */
export class InvalidHexValueError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidHexValueError'

  constructor(value: unknown) {
    super(`Value \`${value}\` is an invalid hex value.`, {
      metaMessages: [
        'Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).',
      ],
    })
  }
}

/** Thrown when a hex string has an odd nibble count. */
export class InvalidLengthError extends Errors.BaseError {
  override readonly name = 'Hex.InvalidLengthError'

  constructor(value: Hex) {
    super(
      `Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`,
      {
        metaMessages: ['It must be an even length.'],
      },
    )
  }
}

/** @internal */
export declare namespace bytesToHex {
  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export declare namespace hexToBytes {
  type ErrorType =
    | InvalidHexValueError
    | InvalidLengthError
    | Errors.GlobalErrorType
}

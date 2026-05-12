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

// Phase 2 native fast-path detection: `Uint8Array.prototype.toHex` lands in
// Node 22+, Safari 18+, Firefox 133+. Falls back to `Buffer` on Node, then to
// the JS loop.
const _Buffer: typeof globalThis.Buffer | undefined = (
  globalThis as typeof globalThis & { Buffer?: typeof globalThis.Buffer }
).Buffer
const nativeToHex: ((this: Uint8Array) => string) | undefined = (
  Uint8Array.prototype as Uint8Array & { toHex?: () => string }
).toHex
const nativeFromHex: ((value: string) => Uint8Array) | undefined = (
  Uint8Array as typeof Uint8Array & { fromHex?: (value: string) => Uint8Array }
).fromHex

/**
 * Encodes a `Uint8Array` into a `0x`-prefixed lowercase hex string. Uses the
 * native `Uint8Array.prototype.toHex` (Node 22+, Safari 18+, Firefox 133+) or
 * Node's `Buffer` when available; otherwise a tight JS loop.
 *
 * @internal
 */
export function bytesToHex(value: Uint8Array): Hex {
  if (nativeToHex) return `0x${nativeToHex.call(value)}` as Hex
  if (_Buffer)
    return `0x${_Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex')}` as Hex
  const length = value.length
  const parts = new Array<string>(length)
  for (let i = 0; i < length; i++) parts[i] = hexes[value[i]!]!
  return `0x${parts.join('')}` as Hex
}

/**
 * Strictly decodes a `0x`-prefixed even-length hex string into a `Uint8Array`.
 * Uses the native `Uint8Array.fromHex` (Node 22+, Safari 18+, Firefox 133+) or
 * Node's `Buffer` when available; otherwise a tight JS loop.
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
  const body = value.length === 2 ? '' : (value as string).slice(2)
  if ((body.length & 1) !== 0) throw new InvalidLengthError(value as Hex)

  if (nativeFromHex) {
    try {
      return nativeFromHex(body)
    } catch {
      throw new InvalidHexValueError(value)
    }
  }
  if (_Buffer && body.length > 0) {
    // Buffer.from with 'hex' silently truncates on invalid chars; verify
    // byteLength matches expectations to detect malformed input.
    const expected = body.length >> 1
    const buf = _Buffer.from(body, 'hex')
    if (buf.length !== expected) throw new InvalidHexValueError(value)
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  const length = body.length >> 1
  const out = new Uint8Array(length)
  for (let i = 0, j = 0; i < length; i++) {
    const hi = nibbleTable[body.charCodeAt(j++)]!
    const lo = nibbleTable[body.charCodeAt(j++)]!
    if (hi === 0xff || lo === 0xff) throw new InvalidHexValueError(value)
    out[i] = (hi << 4) | lo
  }
  return out
}

/** @internal */
export function charCodeToBase16(char: number): number | undefined {
  const v = nibbleTable[char]!
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

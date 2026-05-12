import type * as Bytes from '../Bytes.js'
import * as Hex from '../Hex.js'
import type { RecursiveArray } from './types.js'

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/**
 * Encodes a transaction quantity (`bigint` or `number`) as an RLP scalar Hex.
 * Returns `'0x'` (RLP empty bytes) for `undefined`, `null`, or zero values.
 *
 * Replaces the per-envelope `value ? Hex.fromNumber(value) : '0x'` pattern.
 *
 * @internal
 */
export function quantityToHex(
  value: bigint | number | undefined | null,
): Hex.Hex {
  if (value === undefined || value === null) return '0x'
  if (typeof value === 'bigint' ? value === 0n : value === 0) return '0x'
  return Hex.fromNumber(value)
}

/**
 * Decodes an RLP-decoded scalar `Hex` into `bigint`, returning `undefined`
 * when the field was absent (`undefined`) or the empty RLP scalar (`'0x'`).
 *
 * Replaces the per-envelope
 * `Hex.validate(x) && x !== '0x' ? BigInt(x) : undefined` pattern. The
 * `Hex.validate` check is redundant for RLP-decoded fields (always a hex
 * string when present).
 *
 * @internal
 */
export function hexToBigIntOrUndefined(
  value: Hex.Hex | undefined,
): bigint | undefined {
  if (value === undefined || value === '0x') return undefined
  return BigInt(value)
}

/**
 * Decodes an RLP-decoded scalar `Hex` into `bigint`, defaulting to `0n` when
 * the field was absent or the empty RLP scalar.
 *
 * Replaces the per-envelope
 * `Hex.validate(x) ? (x === '0x' ? 0n : BigInt(x)) : undefined` pattern used
 * for `nonce`-like fields where zero is meaningful.
 *
 * @internal
 */
export function hexToBigIntOrZero(value: Hex.Hex | undefined): bigint {
  if (value === undefined || value === '0x') return 0n
  return BigInt(value)
}

/**
 * Decodes an RLP-decoded scalar `Hex` into `number` via `BigInt` to keep the
 * conversion overflow-safe. Returns `undefined` for absent / empty scalars.
 *
 * @internal
 */
export function hexToNumberOrUndefined(
  value: Hex.Hex | undefined,
): number | undefined {
  if (value === undefined || value === '0x') return undefined
  return Number(value)
}

/**
 * Decodes an RLP-decoded scalar `Hex` into `Hex` (identity), returning
 * `undefined` for absent / empty scalars. Used for opaque hex fields like
 * `to` / `data`.
 *
 * @internal
 */
export function hexToHexOrUndefined(
  value: Hex.Hex | undefined,
): Hex.Hex | undefined {
  if (value === undefined || value === '0x') return undefined
  return value
}

/**
 * Decodes a `Bytes` scalar (typically a `Uint8Array.subarray` view returned
 * by `Rlp.toBytes`) into `bigint`, or `undefined` when the field is absent
 * or empty.
 *
 * For payloads ≤ 6 bytes (the common case for `chainId`, `nonce`, `gas`,
 * `value`, etc.) the conversion is done with native `Number` accumulation,
 * skipping the per-leaf hex-string allocation that `Bytes.toBigInt` (which
 * round-trips through `Hex.fromBytes`) performs.
 *
 * @internal
 */
export function bytesToBigIntOrUndefined(
  value: Bytes.Bytes | undefined,
): bigint | undefined {
  if (value === undefined || value.length === 0) return undefined
  return bytesToBigInt(value)
}

/**
 * Decodes a `Bytes` scalar into `bigint`, defaulting to `0n` when the field
 * is empty.
 *
 * @internal
 */
export function bytesToBigIntOrZero(value: Bytes.Bytes | undefined): bigint {
  if (value === undefined || value.length === 0) return 0n
  return bytesToBigInt(value)
}

/**
 * Decodes a `Bytes` scalar into `number` via the same fast path as
 * {@link bytesToBigIntOrUndefined}. Returns `undefined` for absent / empty
 * scalars.
 *
 * @internal
 */
export function bytesToNumberOrUndefined(
  value: Bytes.Bytes | undefined,
): number | undefined {
  if (value === undefined || value.length === 0) return undefined
  return Number(bytesToBigInt(value))
}

/**
 * Encodes a `Bytes` scalar to `Hex`, returning `undefined` when the field is
 * absent or empty. Used for opaque hex fields like `to` / `data` after
 * decoding via `Rlp.toBytes`.
 *
 * @internal
 */
export function bytesToHexOrUndefined(
  value: Bytes.Bytes | undefined,
): Hex.Hex | undefined {
  if (value === undefined || value.length === 0) return undefined
  return bytesToHex(value)
}

/**
 * Encodes a `Bytes` scalar to `Hex` (no `undefined` short-circuit). Used for
 * fields that flow into `Signature.fromTuple` etc., which expect hex inputs.
 *
 * @internal
 */
export function bytesToHex(value: Bytes.Bytes): Hex.Hex {
  let out = '0x'
  for (let i = 0; i < value.length; i++) out += hexes[value[i]!]
  return out as Hex.Hex
}

/**
 * Recursively maps a `RecursiveArray<Bytes>` (e.g. as returned by
 * `Rlp.toBytes`) to a `RecursiveArray<Hex>`. Used by envelope decoders to
 * hand the (rarely-large) access list / authorization list sub-trees off to
 * their existing hex-typed `fromTupleList` codecs without re-running RLP.
 *
 * @internal
 */
export function bytesTreeToHex(
  value: RecursiveArray<Bytes.Bytes>,
): RecursiveArray<Hex.Hex> {
  if (Array.isArray(value)) return value.map((x) => bytesTreeToHex(x))
  return bytesToHex(value as Bytes.Bytes)
}

function bytesToBigInt(value: Bytes.Bytes): bigint {
  // Fast path: values up to 6 bytes fit in a JS `number` precisely. Avoid
  // allocating the intermediate hex string altogether.
  const len = value.length
  if (len <= 6) {
    let n = 0
    for (let i = 0; i < len; i++) n = n * 256 + value[i]!
    return BigInt(n)
  }
  // Wider scalars (e.g. 32-byte fee values) round-trip through hex; the
  // allocated string is the same one `BigInt` would build internally and is
  // released immediately after parsing.
  let hex = '0x'
  for (let i = 0; i < len; i++) hex += hexes[value[i]!]
  return BigInt(hex)
}

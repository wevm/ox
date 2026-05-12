import * as Hex from '../Hex.js'

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

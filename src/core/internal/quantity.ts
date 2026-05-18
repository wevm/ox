import * as Hex from '../Hex.js'

/** @internal */
export class MissingFieldError extends Error {
  override readonly name = 'Quantity.MissingFieldError'
  constructor(args: { field: string; container?: string | undefined }) {
    const { field, container } = args
    super(
      container
        ? `Missing required field \`${field}\` on \`${container}\`.`
        : `Missing required field \`${field}\`.`,
    )
  }
}

/**
 * Converts an optional RPC quantity (`Hex.Hex | undefined | null`) to `bigint | undefined`.
 *
 * Returns `undefined` for both `undefined` and `null` (RPC encoders may use either to mean "absent").
 *
 * @internal
 */
export function toBigInt(
  value: Hex.Hex | undefined | null,
): bigint | undefined {
  if (value === undefined || value === null) return undefined
  return BigInt(value)
}

/**
 * Converts a required RPC quantity to `bigint`. Throws `MissingFieldError` if the
 * value is `undefined` or `null`.
 *
 * @internal
 */
export function toBigIntRequired(
  value: Hex.Hex | undefined | null,
  field: string,
  container?: string | undefined,
): bigint {
  if (value === undefined || value === null)
    throw new MissingFieldError(container ? { field, container } : { field })
  return BigInt(value)
}

/**
 * Converts an optional RPC quantity to `number | undefined` via `BigInt` to avoid
 * silent precision loss on values that overflow Number.MAX_SAFE_INTEGER.
 *
 * Returns `undefined` for both `undefined` and `null`.
 *
 * @internal
 */
export function toNumber(
  value: Hex.Hex | undefined | null,
): number | undefined {
  if (value === undefined || value === null) return undefined
  return Number(value)
}

/**
 * Converts an optional `bigint` to an RPC quantity (`Hex.Hex | undefined`).
 *
 * @internal
 */
export function fromBigInt(
  value: bigint | undefined | null,
): Hex.Hex | undefined {
  if (typeof value !== 'bigint') return undefined
  return Hex.fromNumber(value)
}

/**
 * Converts an optional `number` to an RPC quantity (`Hex.Hex | undefined`).
 *
 * @internal
 */
export function fromNumber(
  value: number | undefined | null,
): Hex.Hex | undefined {
  if (typeof value !== 'number') return undefined
  return Hex.fromNumber(value)
}

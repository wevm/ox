import * as Hex from '../Hex.js'

/**
 * Converts a "numberish" value (`Hex.Hex | bigint | number`) to an RPC quantity
 * (`Hex.Hex`). Hex values are passed through unchanged; numbers and bigints are
 * encoded via {@link ox#Hex.(fromNumber:function)}.
 *
 * @internal
 */
export function fromNumberish(
  value: Hex.Hex | bigint | number,
  options?: Hex.fromNumber.Options,
): Hex.Hex {
  if (typeof value === 'string') return value
  return Hex.fromNumber(value, options)
}

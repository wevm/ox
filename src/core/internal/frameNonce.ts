import * as Errors from '../Errors.js'
import * as Hex from '../Hex.js'
import * as Quantity from './quantity.js'

/**
 * Asserts keyed nonce constraints.
 * @internal
 */
export function assert(keys: readonly bigint[], nonce?: bigint): void {
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > 16)
    throw new InvalidError('Expected between 1 and 16 nonce keys.')
  for (const [index, key] of keys.entries()) {
    if (typeof key !== 'bigint' || key < 0n || key >= 2n ** 256n)
      throw new InvalidError('Nonce keys must be unsigned 256-bit integers.')
    if (index > 0 && key <= keys[index - 1]!)
      throw new InvalidError('Nonce keys must be strictly increasing.')
  }
  if (keys.length > 1 && keys[0] === 0n)
    throw new InvalidError(
      'The zero nonce key cannot be combined with other keys.',
    )
  if (
    nonce !== undefined &&
    (typeof nonce !== 'bigint' || nonce < 0n || nonce >= 2n ** 64n - 1n)
  )
    throw new InvalidError('Nonce must be less than 2^64 - 1 and nonnegative.')
}

/**
 * Decodes and validates RPC nonce keys and their shared sequence.
 * @internal
 */
export function fromRpc(
  keys: readonly Hex.Hex[],
  nonce?: Hex.Hex,
): readonly bigint[] {
  if (!Array.isArray(keys)) throw new InvalidError('Expected a nonce key list.')
  const integer = (value: Hex.Hex): bigint => {
    if (
      typeof value !== 'string' ||
      !/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)
    )
      throw new InvalidError('Expected a canonical RPC nonce quantity.')
    return Hex.toBigInt(value)
  }
  const decoded = keys.map(integer)
  assert(decoded, nonce === undefined ? undefined : integer(nonce))
  return decoded
}

/**
 * Encodes and validates nonce keys and their shared sequence.
 * @internal
 */
export function toRpc(
  keys: readonly (Hex.Hex | bigint | number)[],
  nonce?: Hex.Hex | bigint | number,
): readonly Hex.Hex[] {
  if (!Array.isArray(keys)) throw new InvalidError('Expected a nonce key list.')
  const encoded = keys.map((key) => Quantity.fromNumberish(key))
  fromRpc(
    encoded,
    nonce === undefined ? undefined : Quantity.fromNumberish(nonce),
  )
  return encoded
}

export class InvalidError extends Errors.BaseError {
  override readonly name = 'FrameNonce.InvalidError'
}

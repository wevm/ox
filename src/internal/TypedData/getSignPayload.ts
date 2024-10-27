import type { TypedData } from 'abitype'
import type * as Errors from '../../Errors.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Hex } from '../Hex/types.js'
import { TypedData_encode } from './encode.js'

/**
 * Gets the payload to use for signing typed data in [EIP-712 format](https://eips.ethereum.org/EIPS/eip-712).
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, TypedData, Hash } from 'ox'
 *
 * const payload = TypedData.getSignPayload({ // [!code focus:99]
 *   domain: {
 *     name: 'Ether Mail',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0x0000000000000000000000000000000000000000',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: {
 *       name: 'Cow',
 *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
 *     },
 *     to: {
 *       name: 'Bob',
 *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
 *     },
 *     contents: 'Hello, Bob!',
 *   },
 * })
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param value - The typed data to get the sign payload for.
 * @returns The payload to use for signing.
 */
export function TypedData_getSignPayload<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_encode.Value<typedData, primaryType>): Hex {
  return Hash_keccak256(TypedData_encode(value))
}

export declare namespace TypedData_getSignPayload {
  type ErrorType =
    | Hash_keccak256.ErrorType
    | TypedData_encode.ErrorType
    | Errors.GlobalErrorType
}

TypedData_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_getSignPayload.ErrorType

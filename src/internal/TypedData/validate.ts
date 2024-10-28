import type { Errors } from '../../Errors.js'
import { TypedData_assert } from './assert.js'
import type { TypedData } from './types.js'

/**
 * Checks if [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) is valid.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * const valid = TypedData.validate({
 *   domain: {
 *     name: 'Ether!',
 *     version: '1',
 *     chainId: 1,
 *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
 *   },
 *   primaryType: 'Foo',
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   message: {
 *     address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *     name: 'jxom',
 *     foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   },
 * })
 * // @log: true
 * ```
 *
 * @param value - The Typed Data to validate.
 */
export function TypedData_validate<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_assert.Value<typedData, primaryType>): boolean {
  try {
    TypedData_assert(value)
    return true
  } catch {
    return false
  }
}

export declare namespace TypedData_validate {
  type ErrorType = TypedData_assert.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
TypedData_validate.parseError = (error: unknown) =>
  error as TypedData_validate.ErrorType

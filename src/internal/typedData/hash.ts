import type { TypedData } from 'abitype'

import { concat } from '../data/concat.js'
import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import type { Hex } from '../types/data.js'
import type { TypedDataDefinition } from '../types/typedData.js'
import { extractEip712DomainTypes } from './extractEip712DomainTypes.js'
import { hashDomain } from './hashDomain.js'
import { hashStruct } from './hashStruct.js'
import { validateTypedData } from './validate.js'

/**
 * Hashes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).
 *
 * - Docs: https://oxlib.sh/api/typedData/hash
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.hash({
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Foo',
 *   message: {
 *     address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *     name: 'jxom',
 *     foo: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   },
 * })
 * // '0x7ef8d6931ed54977c7593289c0feb25c7d7424fb997f4fc20aa3fe51b5141188'
 * ```
 */
export function hashTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(
  value: hashTypedData.Value<typedData, primaryType>,
): hashTypedData.ReturnType {
  const { domain = {}, message, primaryType } = value as hashTypedData.Value

  const types = {
    EIP712Domain: extractEip712DomainTypes(domain),
    ...value.types,
  } as TypedData

  // Need to do a runtime validation check on addresses, byte ranges, integer ranges, etc
  // as we can't statically check this with TypeScript.
  validateTypedData({
    domain,
    message,
    primaryType,
    types,
  })

  const parts: Hex[] = ['0x1901']
  if (domain)
    parts.push(
      hashDomain({
        domain,
        types,
      }),
    )

  if (primaryType !== 'EIP712Domain')
    parts.push(
      hashStruct({
        data: message,
        primaryType,
        types,
      }),
    )

  return keccak256(concat(...parts))
}

export declare namespace hashTypedData {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedDataDefinition<typedData, primaryType>

  type ReturnType = Hex

  type ErrorType =
    | extractEip712DomainTypes.ErrorType
    | hashDomain.ErrorType
    | hashStruct.ErrorType
    | validateTypedData.ErrorType
    | GlobalErrorType
}

hashTypedData.parseError = (error: unknown) => error as hashTypedData.ErrorType

import type { TypedData, TypedDataParameter } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { stringify } from '../stringify.js'
import type { TypedDataDefinition } from '../types/typedData.js'

/**
 * Serializes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) schema into string.
 *
 * - Docs: https://oxlib.sh/api/typedData/serialize
 *
 * @example
 * import { TypedData } from 'ox'
 *
 * TypedData.serialize({
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
 * // "{"domain":{},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"
 */
export function serializeTypedData<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(
  parameters: serializeTypedData.Parameters<typedData, primaryType>,
): serializeTypedData.ReturnType {
  const {
    domain: domain_,
    message: message_,
    primaryType,
    types,
  } = parameters as unknown as serializeTypedData.Parameters

  const normalizeData = (
    struct: readonly TypedDataParameter[],
    value: Record<string, unknown>,
  ) => {
    const data = { ...value }
    for (const param of struct) {
      const { name, type } = param
      if (type === 'address') data[name] = (data[name] as string).toLowerCase()
    }
    return data
  }

  const domain = (() => {
    if (!types.EIP712Domain) return {}
    if (!domain_) return {}
    return normalizeData(types.EIP712Domain, domain_)
  })()

  const message = (() => {
    if (primaryType === 'EIP712Domain') return undefined
    if (!types[primaryType]) return {}
    return normalizeData(types[primaryType], message_)
  })()

  return stringify({ domain, message, primaryType, types })
}

export declare namespace serializeTypedData {
  type Parameters<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedDataDefinition<typedData, primaryType>

  type ReturnType = string

  type ErrorType = stringify.ErrorType | GlobalErrorType
}

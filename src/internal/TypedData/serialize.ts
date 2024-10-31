import type * as Errors from '../../Errors.js'
import * as Json from '../../Json.js'
import type {
  TypedData,
  TypedData_Definition,
  TypedData_Parameter,
} from './types.js'

/**
 * Serializes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) schema into string.
 *
 * @example
 * ```ts twoslash
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
 * // @log: "{"domain":{},"message":{"address":"0xb9cab4f0e46f7f6b1024b5a7463734fa68e633f9","name":"jxom","foo":"0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9"},"primaryType":"Foo","types":{"Foo":[{"name":"address","type":"address"},{"name":"name","type":"string"},{"name":"foo","type":"string"}]}}"
 * ```
 *
 * @param value - The Typed Data schema to serialize.
 * @returns The serialized Typed Data schema. w
 */
export function TypedData_serialize<
  const typedData extends TypedData | Record<string, unknown>,
  primaryType extends keyof typedData | 'EIP712Domain',
>(value: TypedData_serialize.Value<typedData, primaryType>): string {
  const {
    domain: domain_,
    message: message_,
    primaryType,
    types,
  } = value as unknown as TypedData_serialize.Value

  const normalizeData = (
    struct: readonly TypedData_Parameter[],
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

  return Json.stringify({ domain, message, primaryType, types }, (_, value) => {
    if (typeof value === 'bigint') return value.toString()
    return value
  })
}

export declare namespace TypedData_serialize {
  type Value<
    typedData extends TypedData | Record<string, unknown> = TypedData,
    primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  > = TypedData_Definition<typedData, primaryType>

  type ErrorType = Json.stringify.ErrorType | Errors.GlobalErrorType
}

TypedData_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TypedData_serialize.ErrorType

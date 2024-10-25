import type * as Errors from '../../Errors.js'
import type { TypedData } from './types.js'

// TODO: Add error for `primaryType` not in `types`

/**
 * Encodes [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712) schema for the provided primaryType.
 *
 * @example
 * ```ts twoslash
 * import { TypedData } from 'ox'
 *
 * TypedData.encodeType({
 *   types: {
 *     Foo: [
 *       { name: 'address', type: 'address' },
 *       { name: 'name', type: 'string' },
 *       { name: 'foo', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Foo',
 * })
 * // @log: 'Foo(address address,string name,string foo)'
 * ```
 *
 * @param value - The Typed Data schema.
 * @returns The encoded type.
 */
export function TypedData_encodeType(
  value: TypedData_encodeType.Value,
): string {
  const { primaryType, types } = value

  let result = ''
  const unsortedDeps = findTypeDependencies({ primaryType, types })
  unsortedDeps.delete(primaryType)

  const deps = [primaryType, ...Array.from(unsortedDeps).sort()]
  for (const type of deps) {
    result += `${type}(${(types[type] ?? [])
      .map(({ name, type: t }) => `${t} ${name}`)
      .join(',')})`
  }

  return result
}

export declare namespace TypedData_encodeType {
  type Value = {
    primaryType: string
    types: TypedData
  }

  type ErrorType = findTypeDependencies.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
TypedData_encodeType.parseError = (error: unknown) =>
  error as TypedData_encodeType.ErrorType

/** @internal */
export function findTypeDependencies(
  value: {
    primaryType: string
    types: TypedData
  },
  results: Set<string> = new Set(),
): Set<string> {
  const { primaryType: primaryType_, types } = value
  const match = primaryType_.match(/^\w*/u)
  const primaryType = match?.[0]!
  if (results.has(primaryType) || types[primaryType] === undefined)
    return results

  results.add(primaryType)

  for (const field of types[primaryType])
    findTypeDependencies({ primaryType: field.type, types }, results)
  return results
}

/** @internal */
export declare namespace findTypeDependencies {
  type ErrorType = Errors.GlobalErrorType
}

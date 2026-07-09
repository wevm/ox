/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import type * as core_TypedData from '../core/TypedData.js'
import * as z_Address from './Address.js'
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

export const Domain = z.object({
  chainId: z.optional(z.union([z.number(), z.bigint()])),
  name: z.optional(z_Solidity.Identifier),
  salt: z.optional(z.string()),
  verifyingContract: z.optional(z_Address.Address),
  version: z.optional(z.string()),
})

export const Type = z.union([
  z_Solidity.Address,
  z_Solidity.Bool,
  z_Solidity.Bytes,
  z_Solidity.String,
  z_Solidity.Int,
  z_Solidity.Array,
])

export const Parameter = z.object({
  name: z_Solidity.Identifier,
  type: z.string(),
})

const Raw = z.record(z_Solidity.Identifier, z.readonly(z.array(Parameter)))

export const TypedData = z.pipe(
  Raw,
  z.transform((value, ctx) => validate(value, ctx)),
)

function validate(
  typedData: Record<string, readonly core_TypedData.Parameter[]>,
  ctx: z.core.ParsePayload,
) {
  for (const key of Object.keys(typedData)) {
    if (z_Solidity.isType(key)) {
      ctx.issues.push({
        code: 'custom',
        input: key,
        message: `Invalid key. ${key} is a solidity type.`,
      })
      return z.NEVER
    }

    validateParameters(key, typedData, ctx)
  }

  return typedData as core_TypedData.TypedData
}

const typeWithoutTupleRegex =
  /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*?)(?<array>(?:\[\d*?\])+?)?$/

function validateParameters(
  key: string,
  typedData: Record<string, readonly core_TypedData.Parameter[]>,
  ctx: z.core.ParsePayload,
  ancestors = new Set<string>(),
) {
  const value = typedData[key]
  if (!value) return

  for (const parameter of value) {
    if (parameter.type === key) {
      ctx.issues.push({
        code: 'custom',
        input: parameter.type,
        message: `Invalid type. ${key} is a self reference.`,
      })
      return z.NEVER
    }

    const match = typeWithoutTupleRegex.exec(parameter.type)?.groups as
      | { array?: string | undefined; type?: string | undefined }
      | undefined
    const type = match?.type
    if (!type) {
      ctx.issues.push({
        code: 'custom',
        input: parameter.type,
        message: `Invalid type. ${key} does not have a type.`,
      })
      return z.NEVER
    }

    if (type in typedData) {
      if (ancestors.has(type)) {
        ctx.issues.push({
          code: 'custom',
          input: type,
          message: `Invalid type. ${type} is a circular reference.`,
        })
        return z.NEVER
      }

      validateParameters(type, typedData, ctx, new Set([...ancestors, type]))
    } else if (!z_Solidity.isType(type)) {
      ctx.issues.push({
        code: 'custom',
        input: type,
        message: `Invalid type. ${type} is not a valid EIP-712 type.`,
      })
      return z.NEVER
    }
  }
}

/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

const Name = z.union([z.optional(z_Solidity.Identifier), z.literal('')])
const SimpleType = z.union([
  z_Solidity.Address,
  z_Solidity.Bool,
  z_Solidity.Bytes,
  z_Solidity.Function,
  z_Solidity.String,
  z_Solidity.Int,
  z_Solidity.ArrayWithoutTuple,
])
const TupleType = z.union([z_Solidity.Tuple, z_Solidity.ArrayWithTuple])

export const AbiParameter = z.intersection(
  z.object({
    name: Name,
    internalType: z.optional(z.string()),
  }),
  z.union([
    z.object({ type: SimpleType }),
    z.object({
      type: TupleType,
      get components() {
        return z.readonly(z.array(AbiParameter))
      },
    }),
  ]),
)

export const AbiEventParameter = z.intersection(
  AbiParameter,
  z.object({ indexed: z.optional(z.boolean()) }),
)

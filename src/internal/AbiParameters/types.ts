import type {
  AbiParameter,
  AbiParameterToPrimitiveType,
  AbiType,
  ParseAbiParameter,
} from 'abitype'
import type { Compute } from '../types.js'

export type AbiParameters = readonly AbiParameter[]
export type AbiParameters_Parameter = AbiParameter

export type AbiParameters_Isomorphic =
  readonly AbiParameters_IsomorphicParameter[]
export type AbiParameters_IsomorphicParameter =
  | AbiParameter
  | AbiType
  | (string & {})

/** @internal */
export type AbiParameters_ToPrimitiveTypes<
  types extends readonly AbiParameters_IsomorphicParameter[],
> = Compute<{
  [key in keyof types]: types[key] extends AbiParameter
    ? AbiParameterToPrimitiveType<types[key]>
    : types[key] extends AbiType
      ? AbiParameterToPrimitiveType<{ type: types[key] }>
      : types[key] extends string | readonly string[] | readonly unknown[]
        ? AbiParameterToPrimitiveType<ParseAbiParameter<types[key]>>
        : never
}>

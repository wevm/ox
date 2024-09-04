import type {
  AbiParameter,
  AbiParameterKind,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes,
} from 'abitype'
import type { Compute, IsNarrowable, UnionToIntersection } from '../types.js'

export type AbiParameters = readonly AbiParameter[]
export type AbiParameters_Parameter = AbiParameter

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiParameters_ToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParametersToPrimitiveTypes<abiParameters, abiParameterKind>

/** @internal */
export type AbiParameters_ParameterToPrimitiveType<
  abiParameter extends AbiParameter | { name: string; type: unknown },
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParameterToPrimitiveType<abiParameter, abiParameterKind>

/** @internal */
export type AbiParameters_ToObject<
  parameters extends readonly AbiParameter[],
  kind extends AbiParameterKind = AbiParameterKind,
> = IsNarrowable<parameters, AbiParameters> extends true
  ? Compute<
      UnionToIntersection<
        {
          [index in keyof parameters]: parameters[index] extends {
            name: infer name extends string
          }
            ? {
                [key in name]: AbiParameterToPrimitiveType<
                  parameters[index],
                  kind
                >
              }
            : {
                [key in index]: AbiParameterToPrimitiveType<
                  parameters[index],
                  kind
                >
              }
        }[number]
      >
    >
  : unknown

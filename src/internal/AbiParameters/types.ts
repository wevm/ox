import type {
  AbiParameter,
  AbiParameterKind,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes,
} from 'abitype'
import type { Compute, IsNarrowable, UnionToIntersection } from '../types.js'

/** Root type for ABI parameters. */
export type AbiParameters = readonly AbiParameter[]

/** A parameter on an {@link ox#AbiParameters.AbiParameters}. */
export type Parameter = AbiParameter

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type ToPrimitiveTypes<
  abiParameters extends readonly AbiParameter[],
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParametersToPrimitiveTypes<abiParameters, abiParameterKind>

/** @internal */
export type ParameterToPrimitiveType<
  abiParameter extends AbiParameter | { name: string; type: unknown },
  abiParameterKind extends AbiParameterKind = AbiParameterKind,
> = AbiParameterToPrimitiveType<abiParameter, abiParameterKind>

/** @internal */
export type ToObject<
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

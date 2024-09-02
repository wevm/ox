import type {
  AbiConstructor,
  AbiError,
  AbiEvent,
  AbiFallback,
  AbiFunction,
  AbiParameter,
  AbiParametersToPrimitiveTypes,
  ResolvedRegister,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type { IsUnion, UnionToTuple } from '../types.js'

export type AbiItem = Abi[number]
export type AbiItem_Constructor = AbiConstructor
export type AbiItem_Error = AbiError
export type AbiItem_Event = AbiEvent
export type AbiItem_Fallback = AbiFallback
export type AbiItem_Function = AbiFunction

/** @internal */
export type AbiItem_Args<
  abi extends Abi | readonly unknown[] = Abi,
  name extends AbiItem_Name<abi> = AbiItem_Name<abi>,
> = AbiParametersToPrimitiveTypes<
  AbiItem_Extract<abi extends Abi ? abi : Abi, name>['inputs'],
  'inputs'
> extends infer args
  ? [args] extends [never]
    ? readonly unknown[]
    : args
  : readonly unknown[]

/** @internal */
export type AbiItem_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiItem_ExtractNames<abi> : string

/** @internal */
export type AbiItem_Extract<
  abi extends Abi,
  name extends AbiItem_ExtractNames<abi>,
> = Extract<abi[number], { name: name }>

/** @internal */
export type AbiItem_ExtractNames<abi extends Abi> = Extract<
  abi[number],
  { name: string }
>['name']

/** @internal */
export type AbiItem_ExtractForArgs<
  abi extends Abi,
  name extends AbiItem_Name<abi>,
  args extends AbiItem_Args<abi, name>,
> = AbiItem_Extract<abi, name> extends infer abiItem extends AbiItem & {
  inputs: readonly AbiParameter[]
}
  ? IsUnion<abiItem> extends true // narrow overloads using `args` by converting to tuple and filtering out overloads that don't match
    ? UnionToTuple<abiItem> extends infer abiItems extends readonly (AbiItem & {
        inputs: readonly AbiParameter[]
      })[]
      ? {
          [k in keyof abiItems]: (
            readonly [] extends args
              ? readonly [] // fallback to `readonly []` if `args` has no value (e.g. `args` property not provided)
              : args
          ) extends AbiParametersToPrimitiveTypes<
            abiItems[k]['inputs'],
            'inputs'
          >
            ? abiItems[k]
            : never
        }[number] // convert back to union (removes `never` tuple entries: `['foo', never, 'bar'][number]` => `'foo' | 'bar'`)
      : never
    : abiItem
  : never

/** @internal */
export type Widen<type> =
  | ([unknown] extends [type] ? unknown : never)
  | (type extends Function ? type : never)
  | (type extends ResolvedRegister['bigIntType'] ? bigint : never)
  | (type extends boolean ? boolean : never)
  | (type extends ResolvedRegister['intType'] ? number : never)
  | (type extends string
      ? type extends ResolvedRegister['addressType']
        ? ResolvedRegister['addressType']
        : type extends ResolvedRegister['bytesType']['inputs']
          ? ResolvedRegister['bytesType']
          : string
      : never)
  | (type extends readonly [] ? readonly [] : never)
  | (type extends Record<string, unknown>
      ? { [K in keyof type]: Widen<type[K]> }
      : never)
  | (type extends { length: number }
      ? {
          [K in keyof type]: Widen<type[K]>
        } extends infer Val extends readonly unknown[]
        ? readonly [...Val]
        : never
      : never)

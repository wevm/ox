import type {
  AbiConstructor,
  AbiError,
  AbiEvent,
  AbiFallback,
  AbiFunction,
  AbiParameter,
  AbiParametersToPrimitiveTypes,
  ResolvedRegister,
  Abi as abitype_Abi,
} from 'abitype'
import type { IsUnion, UnionToTuple } from '../types.js'

export type Abi = abitype_Abi
export type Abi_Item = Abi[number]

export type Abi_Constructor = AbiConstructor
export type Abi_Error = AbiError
export type Abi_Event = AbiEvent
export type Abi_Fallback = AbiFallback
export type Abi_Function = AbiFunction
export type Abi_Parameter = AbiParameter

/** @internal */
export type Abi_ItemArgs<
  abi extends Abi | readonly unknown[] = Abi,
  name extends Abi_ItemName<abi> = Abi_ItemName<abi>,
> = AbiParametersToPrimitiveTypes<
  Abi_ExtractItem<abi extends Abi ? abi : Abi, name>['inputs'],
  'inputs'
> extends infer args
  ? [args] extends [never]
    ? readonly unknown[]
    : args
  : readonly unknown[]

/** @internal */
export type Abi_ItemName<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? Abi_ExtractItemNames<abi> : string

/** @internal */
export type Abi_ExtractItem<
  abi extends Abi,
  name extends Abi_ExtractItemNames<abi>,
> = Extract<abi[number], { name: name }>

/** @internal */
export type Abi_ExtractItemNames<abi extends Abi> = Extract<
  abi[number],
  { name: string }
>['name']

/** @internal */
export type Abi_ExtractItemForArgs<
  abi extends Abi,
  name extends Abi_ItemName<abi>,
  args extends Abi_ItemArgs<abi, name>,
> = Abi_ExtractItem<abi, name> extends infer abiItem extends Abi_Item & {
  inputs: readonly AbiParameter[]
}
  ? IsUnion<abiItem> extends true // narrow overloads using `args` by converting to tuple and filtering out overloads that don't match
    ? UnionToTuple<abiItem> extends infer abiItems extends
        readonly (Abi_Item & {
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

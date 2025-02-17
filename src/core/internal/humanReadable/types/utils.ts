import type * as abitype from 'abitype'

import type {
  DefaultParseOptions,
  ParseAbiParameter,
  ParseOptions,
  SplitParameters,
} from '../../abiParameter.js'
import type { Evaluate, Trim } from '../../types.js'
import type {
  ErrorSignature,
  EventModifier,
  EventSignature,
  FallbackSignature,
  FunctionModifier,
  FunctionSignature,
  IsConstructorSignature,
  IsErrorSignature,
  IsEventSignature,
  IsFunctionSignature,
  Modifier,
  ReceiveSignature,
  Scope,
} from '../signatures.js'
import type { StructLookup } from '../structs.js'

export type ParseSignature<
  signature extends string,
  structs extends StructLookup | unknown = unknown,
> =
  | (IsErrorSignature<signature> extends true
      ? signature extends ErrorSignature<infer name, infer parameters>
        ? {
            readonly name: name
            readonly type: 'error'
            readonly inputs: ParseAbiParameters<
              SplitParameters<parameters>,
              { structs: structs }
            >
          }
        : never
      : never)
  | (IsEventSignature<signature> extends true
      ? signature extends EventSignature<infer name, infer parameters>
        ? {
            readonly name: name
            readonly type: 'event'
            readonly inputs: ParseAbiParameters<
              SplitParameters<parameters>,
              { modifier: EventModifier; structs: structs }
            >
          }
        : never
      : never)
  | (IsFunctionSignature<signature> extends true
      ? signature extends FunctionSignature<infer name, infer tail>
        ? {
            readonly name: name
            readonly type: 'function'
            readonly stateMutability: _ParseFunctionParametersAndStateMutability<signature>['StateMutability']
            readonly inputs: ParseAbiParameters<
              SplitParameters<
                _ParseFunctionParametersAndStateMutability<signature>['Inputs']
              >,
              { modifier: FunctionModifier; structs: structs }
            >
            readonly outputs: tail extends
              | `${string}returns (${infer returns})`
              | `${string}returns(${
                  // biome-ignore lint/suspicious/noRedeclare: <explanation>
                  infer returns
                })`
              ? ParseAbiParameters<
                  SplitParameters<returns>,
                  { modifier: FunctionModifier; structs: structs }
                >
              : readonly []
          }
        : never
      : never)
  | (IsConstructorSignature<signature> extends true
      ? {
          readonly type: 'constructor'
          readonly stateMutability: _ParseConstructorParametersAndStateMutability<signature>['StateMutability']
          readonly inputs: ParseAbiParameters<
            SplitParameters<
              _ParseConstructorParametersAndStateMutability<signature>['Inputs']
            >,
            { structs: structs }
          >
        }
      : never)
  | (signature extends FallbackSignature<infer stateMutability>
      ? {
          readonly type: 'fallback'
          readonly stateMutability: stateMutability extends `${string}payable`
            ? 'payable'
            : 'nonpayable'
        }
      : never)
  | (signature extends ReceiveSignature
      ? {
          readonly type: 'receive'
          readonly stateMutability: 'payable'
        }
      : never)

export type ParseAbiParameters<
  signatures extends readonly string[],
  options extends ParseOptions = DefaultParseOptions,
> = signatures extends ['']
  ? readonly []
  : readonly [
      ...{
        [key in keyof signatures]: ParseAbiParameter<signatures[key], options>
      },
    ]

export type _ParseFunctionParametersAndStateMutability<
  signature extends string,
> = signature extends
  | `${infer head}returns (${string})`
  | `${
      // biome-ignore lint/suspicious/noRedeclare: <explanation>
      infer head
    }returns(${string})`
  ? _ParseFunctionParametersAndStateMutability<Trim<head>>
  : signature extends `function ${string}(${infer parameters})`
    ? { Inputs: parameters; StateMutability: 'nonpayable' }
    : signature extends `function ${string}(${infer parameters}) ${infer scopeOrStateMutability extends
          | Scope
          | abitype.AbiStateMutability
          | `${Scope} ${abitype.AbiStateMutability}`}`
      ? {
          Inputs: parameters
          StateMutability: _ParseStateMutability<scopeOrStateMutability>
        }
      : signature extends `function ${string}(${infer tail}`
        ? _UnwrapNameOrModifier<tail> extends {
            nameOrModifier: infer scopeOrStateMutability extends string
            End: infer parameters
          }
          ? {
              Inputs: parameters
              StateMutability: _ParseStateMutability<scopeOrStateMutability>
            }
          : never
        : never

type _ParseStateMutability<signature extends string> =
  signature extends `${Scope} ${infer stateMutability extends abitype.AbiStateMutability}`
    ? stateMutability
    : signature extends abitype.AbiStateMutability
      ? signature
      : 'nonpayable'

type _ParseConstructorParametersAndStateMutability<signature extends string> =
  signature extends `constructor(${infer parameters}) payable`
    ? { Inputs: parameters; StateMutability: 'payable' }
    : signature extends `constructor(${infer parameters})`
      ? { Inputs: parameters; StateMutability: 'nonpayable' }
      : never

export type _ParseTuple<
  signature extends `(${string})${string}`,
  options extends ParseOptions = DefaultParseOptions,
> = /** Tuples without name or modifier (e.g. `(string)`, `(string foo)`) */
signature extends `(${infer parameters})`
  ? {
      readonly type: 'tuple'
      readonly components: ParseAbiParameters<
        SplitParameters<parameters>,
        Omit<options, 'modifier'>
      >
    }
  : // Array or fixed-length array tuples (e.g. `(string)[]`, `(string)[5]`)
    signature extends `(${infer head})[${'' | `${abitype.SolidityFixedArrayRange}`}]`
    ? signature extends `(${head})[${infer size}]`
      ? {
          readonly type: `tuple[${size}]`
          readonly components: ParseAbiParameters<
            SplitParameters<head>,
            Omit<options, 'modifier'>
          >
        }
      : never
    : // Array or fixed-length array tuples with name and/or modifier attached (e.g. `(string)[] foo`, `(string)[5] foo`)
      signature extends `(${infer parameters})[${
          | ''
          | `${abitype.SolidityFixedArrayRange}`}] ${infer nameOrModifier}`
      ? signature extends `(${parameters})[${infer size}] ${nameOrModifier}`
        ? nameOrModifier extends `${string}) ${string}`
          ? _UnwrapNameOrModifier<nameOrModifier> extends infer parts extends {
              nameOrModifier: string
              End: string
            }
            ? {
                readonly type: 'tuple'
                readonly components: ParseAbiParameters<
                  SplitParameters<`${parameters})[${size}] ${parts['End']}`>,
                  Omit<options, 'modifier'>
                >
              } & _SplitNameOrModifier<parts['nameOrModifier'], options>
            : never
          : {
              readonly type: `tuple[${size}]`
              readonly components: ParseAbiParameters<
                SplitParameters<parameters>,
                Omit<options, 'modifier'>
              >
            } & _SplitNameOrModifier<nameOrModifier, options>
        : never
      : // Tuples with name and/or modifier attached (e.g. `(string) foo`, `(string bar) foo`)
        signature extends `(${infer parameters}) ${infer nameOrModifier}`
        ? // Check that `nameOrModifier` didn't get matched to `baz) bar) foo` (e.g. `(((string) baz) bar) foo`)
          nameOrModifier extends `${string}) ${string}`
          ? _UnwrapNameOrModifier<nameOrModifier> extends infer parts extends {
              nameOrModifier: string
              End: string
            }
            ? {
                readonly type: 'tuple'
                readonly components: ParseAbiParameters<
                  SplitParameters<`${parameters}) ${parts['End']}`>,
                  Omit<options, 'modifier'>
                >
              } & _SplitNameOrModifier<parts['nameOrModifier'], options>
            : never
          : {
              readonly type: 'tuple'
              readonly components: ParseAbiParameters<
                SplitParameters<parameters>,
                Omit<options, 'modifier'>
              >
            } & _SplitNameOrModifier<nameOrModifier, options>
        : never

// Split name and modifier (e.g. `indexed foo` => `{ name: 'foo', indexed: true }`)
export type _SplitNameOrModifier<
  signature extends string,
  options extends ParseOptions = DefaultParseOptions,
> = Trim<signature> extends infer trimmed
  ? options extends { modifier: Modifier }
    ? // TODO: Check that modifier is allowed
      trimmed extends `${infer mod extends options['modifier']} ${infer name}`
      ? Evaluate<
          { readonly name: Trim<name> } & (mod extends 'indexed'
            ? { readonly indexed: true }
            : object)
        >
      : trimmed extends options['modifier']
        ? trimmed extends 'indexed'
          ? { readonly indexed: true }
          : object
        : { readonly name: trimmed }
    : { readonly name: trimmed }
  : never

// `baz) bar) foo` (e.g. `(((string) baz) bar) foo`)
export type _UnwrapNameOrModifier<
  signature extends string,
  current extends string = '',
> = signature extends `${infer head}) ${infer tail}`
  ? _UnwrapNameOrModifier<
      tail,
      `${current}${current extends '' ? '' : ') '}${head}`
    >
  : { End: Trim<current>; nameOrModifier: Trim<signature> }

import type {
  AbiConstructor,
  AbiError,
  AbiEvent,
  AbiFallback,
  AbiFunction,
  AbiParameter,
  AbiParametersToPrimitiveTypes,
  AbiStateMutability,
  ResolvedRegister,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type { Hex } from '../Hex/types.js'
import type {
  Compute,
  IsNever,
  IsUnion,
  TypeErrorMessage,
  UnionToTuple,
} from '../types.js'

export type AbiItem = Abi[number]

export type AbiItem_Constructor = AbiConstructor

export type AbiItem_Error = AbiError & {
  hash?: Hex | undefined
}

export type AbiItem_Event = AbiEvent & {
  hash?: Hex | undefined
  overloads?: readonly AbiItem[] | undefined
}

export type AbiItem_Fallback = AbiFallback

export type AbiItem_Function = AbiFunction & {
  hash?: Hex | undefined
  overloads?: readonly AbiItem[] | undefined
}

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiItem_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiItem_ExtractNames<abi> : string

/** @internal */
export type AbiItem_Extract<
  abi extends Abi,
  name extends AbiItem_ExtractNames<abi>,
> = Extract<abi[number], { name: name }>

/** @internal */
export type AbiItem_ExtractArgs<
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
export type AbiItem_ExtractNames<abi extends Abi> = Extract<
  abi[number],
  { name: string }
>['name']

/** @internal */
export type AbiItem_ExtractForArgs<
  abi extends Abi,
  name extends AbiItem_Name<abi>,
  args extends AbiItem_ExtractArgs<abi, name>,
> = IsUnion<name> extends true
  ? {
      [key in keyof abi]: abi[key] extends { name: name } ? abi[key] : never
    }[number]
  : AbiItem_Extract<abi, name> extends infer abiItem extends AbiItem & {
        inputs: readonly AbiParameter[]
      }
    ? IsUnion<abiItem> extends true // narrow overloads using `args` by converting to tuple and filtering out overloads that don't match
      ? UnionToTuple<abiItem> extends infer abiItems extends
          readonly (AbiItem & {
            inputs: readonly AbiParameter[]
          })[]
        ? IsNever<TupleToUnion<abiItems, abi, name, args>> extends true
          ? Compute<
              abiItems[0] & {
                readonly overloads: UnionToTuple<
                  Exclude<abiItems[number], abiItems[0]>
                >
              }
            >
          : TupleToUnion<abiItems, abi, name, args> // convert back to union (removes `never` tuple entries: `['foo', never, 'bar'][number]` => `'foo' | 'bar'`)
        : never
      : abiItem
    : never

/** @internal */
export type TupleToUnion<
  abiItems extends readonly {
    inputs: readonly AbiParameter[]
  }[],
  abi extends Abi,
  name extends AbiItem_Name<abi>,
  args extends AbiItem_ExtractArgs<abi, name>,
> = {
  [k in keyof abiItems]: (
    readonly [] extends args
      ? readonly [] // fallback to `readonly []` if `args` has no value (e.g. `args` property not provided)
      : args
  ) extends AbiParametersToPrimitiveTypes<abiItems[k]['inputs'], 'inputs'>
    ? abiItems[k]
    : never
}[number]

/** @internal */
export type ErrorSignature<
  name extends string = string,
  parameters extends string = string,
> = `error ${name}(${parameters})`

/** @internal */
export type IsErrorSignature<signature extends string> =
  signature extends ErrorSignature<infer name> ? IsName<name> : false

/** @internal */
export type EventSignature<
  name extends string = string,
  parameters extends string = string,
> = `event ${name}(${parameters})`

/** @internal */
export type IsEventSignature<signature extends string> =
  signature extends EventSignature<infer name> ? IsName<name> : false

/** @internal */
export type FunctionSignature<
  name extends string = string,
  tail extends string = string,
> = `function ${name}(${tail}`
export type IsFunctionSignature<signature> =
  signature extends FunctionSignature<infer name>
    ? IsName<name> extends true
      ? signature extends ValidFunctionSignatures
        ? true
        : // Check that `Parameters` is not absorbing other types (e.g. `returns`)
          signature extends `function ${string}(${infer parameters})`
          ? parameters extends InvalidFunctionParameters
            ? false
            : true
          : false
      : false
    : false
/** @internal */
export type Scope = 'public' | 'external' // `internal` or `private` functions wouldn't make it to ABI so can ignore

/** @internal */
export type Returns = `returns (${string})` | `returns(${string})`

// Almost all valid function signatures, except `function ${string}(${infer parameters})` since `parameters` can absorb returns
/** @internal */
export type ValidFunctionSignatures =
  | `function ${string}()`
  // basic
  | `function ${string}() ${Returns}`
  | `function ${string}() ${AbiStateMutability}`
  | `function ${string}() ${Scope}`
  // combinations
  | `function ${string}() ${AbiStateMutability} ${Returns}`
  | `function ${string}() ${Scope} ${Returns}`
  | `function ${string}() ${Scope} ${AbiStateMutability}`
  | `function ${string}() ${Scope} ${AbiStateMutability} ${Returns}`
  // Parameters
  | `function ${string}(${string}) ${Returns}`
  | `function ${string}(${string}) ${AbiStateMutability}`
  | `function ${string}(${string}) ${Scope}`
  | `function ${string}(${string}) ${AbiStateMutability} ${Returns}`
  | `function ${string}(${string}) ${Scope} ${Returns}`
  | `function ${string}(${string}) ${Scope} ${AbiStateMutability}`
  | `function ${string}(${string}) ${Scope} ${AbiStateMutability} ${Returns}`

/** @internal */
export type StructSignature<
  name extends string = string,
  properties extends string = string,
> = `struct ${name} {${properties}}`

/** @internal */
export type IsStructSignature<signature extends string> =
  signature extends StructSignature<infer name> ? IsName<name> : false

/** @internal */
export type ConstructorSignature<tail extends string = string> =
  `constructor(${tail}`

/** @internal */
export type IsConstructorSignature<signature> =
  signature extends ConstructorSignature
    ? signature extends ValidConstructorSignatures
      ? true
      : false
    : false

/** @internal */
export type ValidConstructorSignatures =
  | `constructor(${string})`
  | `constructor(${string}) payable`

/** @internal */
export type FallbackSignature<abiStateMutability extends '' | ' payable' = ''> =
  `fallback() external${abiStateMutability}`

/** @internal */
export type ReceiveSignature = 'receive() external payable'

// TODO: Maybe use this for signature validation one day
// https://twitter.com/devanshj__/status/1610423724708343808
/** @internal */
export type IsSignature<type extends string> =
  | (IsErrorSignature<type> extends true ? true : never)
  | (IsEventSignature<type> extends true ? true : never)
  | (IsFunctionSignature<type> extends true ? true : never)
  | (IsStructSignature<type> extends true ? true : never)
  | (IsConstructorSignature<type> extends true ? true : never)
  | (type extends FallbackSignature ? true : never)
  | (type extends ReceiveSignature ? true : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiItem_Signature<
  string1 extends string,
  string2 extends string | unknown = unknown,
> = IsSignature<string1> extends true
  ? string1
  : string extends string1 // if exactly `string` (not narrowed), then pass through as valid
    ? string1
    : TypeErrorMessage<`Signature "${string1}" is invalid${string2 extends string
        ? ` at position ${string2}`
        : ''}.`>

/** @internal */
export type AbiItem_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiItem_Signature<signatures[key], key>
}

/** @internal */
export type IsName<name extends string> = name extends ''
  ? false
  : ValidateName<name> extends name
    ? true
    : false

/** @internal */
export type ValidateName<
  name extends string,
  checkCharacters extends boolean = false,
> = name extends `${string}${' '}${string}`
  ? TypeErrorMessage<`Identifier "${name}" cannot contain whitespace.`>
  : IsSolidityKeyword<name> extends true
    ? TypeErrorMessage<`"${name}" is a protected Solidity keyword.`>
    : name extends `${number}`
      ? TypeErrorMessage<`Identifier "${name}" cannot be a number string.`>
      : name extends `${number}${string}`
        ? TypeErrorMessage<`Identifier "${name}" cannot start with a number.`>
        : checkCharacters extends true
          ? IsValidCharacter<name> extends true
            ? name
            : TypeErrorMessage<`"${name}" contains invalid character.`>
          : name

/** @internal */
export type IsSolidityKeyword<type extends string> =
  type extends SolidityKeywords ? true : false

/** @internal */
export type SolidityKeywords =
  | 'after'
  | 'alias'
  | 'anonymous'
  | 'apply'
  | 'auto'
  | 'byte'
  | 'calldata'
  | 'case'
  | 'catch'
  | 'constant'
  | 'copyof'
  | 'default'
  | 'defined'
  | 'error'
  | 'event'
  | 'external'
  | 'false'
  | 'final'
  | 'function'
  | 'immutable'
  | 'implements'
  | 'in'
  | 'indexed'
  | 'inline'
  | 'internal'
  | 'let'
  | 'mapping'
  | 'match'
  | 'memory'
  | 'mutable'
  | 'null'
  | 'of'
  | 'override'
  | 'partial'
  | 'private'
  | 'promise'
  | 'public'
  | 'pure'
  | 'reference'
  | 'relocatable'
  | 'return'
  | 'returns'
  | 'sizeof'
  | 'static'
  | 'storage'
  | 'struct'
  | 'super'
  | 'supports'
  | 'switch'
  | 'this'
  | 'true'
  | 'try'
  | 'typedef'
  | 'typeof'
  | 'var'
  | 'view'
  | 'virtual'
  | `address${`[${string}]` | ''}`
  | `bool${`[${string}]` | ''}`
  | `string${`[${string}]` | ''}`
  | `tuple${`[${string}]` | ''}`
  | `bytes${number | ''}${`[${string}]` | ''}`
  | `${'u' | ''}int${number | ''}${`[${string}]` | ''}`

/** @internal */
export type IsValidCharacter<character extends string> =
  character extends `${ValidCharacters}${infer tail}`
    ? tail extends ''
      ? true
      : IsValidCharacter<tail>
    : false

// biome-ignore format: no formatting
export type ValidCharacters =
  // uppercase letters
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  // lowercase letters
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  // numbers
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  // special characters
  | '_' | '$'

// Template string inference can absorb `returns`:
// type Result = `function foo(string) return s (uint256)` extends `function ${string}(${infer Parameters})` ? Parameters : never
// //   ^? type Result = "string ) return s (uint256"
// So we need to validate against `returns` keyword with all combinations of whitespace
export type InvalidFunctionParameters =
  | `${string}${MangledReturns} (${string}`
  | `${string}) ${MangledReturns}${string}`
  | `${string})${string}${MangledReturns}${string}(${string}`
// r_e_t_u_r_n_s
export type MangledReturns =
  // Single
  | `r${string}eturns`
  | `re${string}turns`
  | `ret${string}urns`
  | `retu${string}rns`
  | `retur${string}ns`
  | `return${string}s`
  // Double
  // `r_e*`
  | `r${string}e${string}turns`
  | `r${string}et${string}urns`
  | `r${string}etu${string}rns`
  | `r${string}etur${string}ns`
  | `r${string}eturn${string}s`
  // `re_t*`
  | `re${string}t${string}urns`
  | `re${string}tu${string}rns`
  | `re${string}tur${string}ns`
  | `re${string}turn${string}s`
  // `ret_u*`
  | `ret${string}u${string}rns`
  | `ret${string}ur${string}ns`
  | `ret${string}urn${string}s`
  // `retu_r*`
  | `retu${string}r${string}ns`
  | `retu${string}rn${string}s`
  // `retur_n*`
  | `retur${string}n${string}s`
  // Triple
  // `r_e_t*`
  | `r${string}e${string}t${string}urns`
  | `r${string}e${string}tu${string}rns`
  | `r${string}e${string}tur${string}ns`
  | `r${string}e${string}turn${string}s`
  // `re_t_u*`
  | `re${string}t${string}u${string}rns`
  | `re${string}t${string}ur${string}ns`
  | `re${string}t${string}urn${string}s`
  // `ret_u_r*`
  | `ret${string}u${string}r${string}ns`
  | `ret${string}u${string}rn${string}s`
  // `retu_r_n*`
  | `retu${string}r${string}n${string}s`
  // Quadruple
  // `r_e_t_u*`
  | `r${string}e${string}t${string}u${string}rns`
  | `r${string}e${string}t${string}ur${string}ns`
  | `r${string}e${string}t${string}urn${string}s`
  // `re_t_u_r*`
  | `re${string}t${string}u${string}r${string}ns`
  | `re${string}t${string}u${string}rn${string}s`
  // `ret_u_r_n*`
  | `ret${string}u${string}r${string}n${string}s`
  // Quintuple
  // `r_e_t_u_r*`
  | `r${string}e${string}t${string}u${string}r${string}ns`
  | `r${string}e${string}t${string}u${string}rn${string}s`
  // `re_t_u_r_n*`
  | `re${string}t${string}u${string}r${string}n${string}s`
  // Sextuple
  // `r_e_t_u_r_n_s`
  | `r${string}e${string}t${string}u${string}r${string}n${string}s`

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

import type * as abitype from 'abitype'

import * as Errors from './Errors.js'
import * as internal from './internal/abiParameter.js'
import * as internal_signatures from './internal/humanReadable/signatures.js'
import * as internal_structs from './internal/humanReadable/structs.js'
import * as internal_regex from './internal/regex.js'
import type {
  FilterReverse,
  IsNarrowableIncludingNever,
  Join,
  TypeErrorMessage,
} from './internal/types.js'

/** Root type for ABI parameters. */
export type AbiParameter = abitype.AbiParameter

/**
 * Formats {@link ox#AbiParameter.AbiParameter} into **Human Readable ABI Parameter**.
 *
 * TODO
 */
export function format<
  const abiParameter extends AbiParameter | abitype.AbiEventParameter,
>(abiParameter: abiParameter): format.ReturnType<abiParameter>

// eslint-disable-next-line jsdoc/require-jsdoc
export function format(abiParameter: AbiParameter): string {
  let type = abiParameter.type
  if (
    internal_regex.tupleAbiParameterType.test(abiParameter.type) &&
    'components' in abiParameter
  ) {
    type = '('
    const length = abiParameter.components.length as number
    for (let i = 0; i < length; i++) {
      const component = abiParameter.components[i]!
      type += format(component)
      if (i < length - 1) type += ', '
    }
    const result = internal_regex.execTyped<{ array?: string }>(
      internal_regex.tupleAbiParameterType,
      abiParameter.type,
    )
    type += `)${result?.array ?? ''}`
    return format({
      ...abiParameter,
      type,
    })
  }
  // Add `indexed` to type if in `abiParameter`
  if ('indexed' in abiParameter && abiParameter.indexed)
    type = `${type} indexed`
  // Return human-readable ABI parameter
  if (abiParameter.name) return `${type} ${abiParameter.name}`
  return type
}

export declare namespace format {
  type ReturnType<
    abiParameter extends AbiParameter | abitype.AbiEventParameter,
  > = abiParameter extends {
    name?: infer name extends string
    type: `tuple${infer array}`
    components: infer components extends readonly AbiParameter[]
    indexed?: infer indexed extends boolean
  }
    ? format.ReturnType<
        {
          type: `(${Join<
            {
              [key in keyof components]: format.ReturnType<
                {
                  type: components[key]['type']
                } & (IsNarrowableIncludingNever<
                  components[key]['name'],
                  string
                > extends true
                  ? { name: components[key]['name'] }
                  : unknown) &
                  (components[key] extends {
                    components: readonly AbiParameter[]
                  }
                    ? { components: components[key]['components'] }
                    : unknown)
              >
            },
            ', '
          >})${array}`
        } & (IsNarrowableIncludingNever<name, string> extends true
          ? { name: name }
          : unknown) &
          (IsNarrowableIncludingNever<indexed, boolean> extends true
            ? { indexed: indexed }
            : unknown)
      >
    : `${abiParameter['type']}${abiParameter extends { indexed: true }
        ? ' indexed'
        : ''}${abiParameter['name'] extends infer name extends string
        ? name extends ''
          ? ''
          : ` ${internal_signatures.AssertName<name>}`
        : ''}`

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses **JSON ABI Parameter** or **Human Readable ABI Parameter** into typed {@link ox#AbiParameter.AbiParameter}.
 *
 * TODO
 */
export function from<
  const param extends string | readonly string[] | readonly unknown[],
>(
  param: abitype.Narrow<param> &
    (
      | (param extends string
          ? param extends ''
            ? TypeErrorMessage<'Empty string is not allowed.'>
            : unknown
          : never)
      | (param extends readonly string[]
          ? param extends readonly [] // empty array
            ? TypeErrorMessage<'At least one parameter required.'>
            : string[] extends param
              ? unknown
              : unknown // TODO: Validate param string
          : never)
    ),
): from.ReturnType<param>

// eslint-disable-next-line jsdoc/require-jsdoc
export function from(
  param: string | readonly string[] | readonly unknown[],
): AbiParameter {
  if (typeof param === 'string')
    return internal.parseAbiParameter(param, {
      modifiers: internal_signatures.modifiers,
    })

  const abiParameter = (() => {
    const structs = internal_structs.parseStructs(param as readonly string[])
    const length = param.length
    for (let i = 0; i < length; i++) {
      const signature = (param as readonly string[])[i]!
      if (internal_signatures.isStructSignature(signature)) continue
      return internal.parseAbiParameter(signature, {
        modifiers: internal_signatures.modifiers,
        structs,
      })
    }
    return undefined
  })()

  if (!abiParameter) throw new InvalidAbiParameterError({ param })

  return abiParameter
}

export declare namespace from {
  type ReturnType<
    param extends string | readonly string[] | readonly unknown[],
  > =
    | (param extends string
        ? param extends ''
          ? never
          : string extends param
            ? AbiParameter
            : internal.ParseAbiParameter<
                param,
                { modifier: internal_signatures.Modifier }
              >
        : never)
    | (param extends readonly string[]
        ? string[] extends param
          ? AbiParameter // Return generic AbiParameter item since type was no inferrable
          : internal_structs.ParseStructs<param> extends infer structs
            ? {
                [key in keyof param]: param[key] extends string
                  ? internal_signatures.IsStructSignature<
                      param[key]
                    > extends true
                    ? never
                    : internal.ParseAbiParameter<
                        param[key],
                        {
                          modifier: internal_signatures.Modifier
                          structs: structs
                        }
                      >
                  : never
              } extends infer mapped extends readonly unknown[]
              ? FilterReverse<mapped, never>[0] extends infer result
                ? result extends undefined
                  ? never
                  : result
                : never
              : never
            : never
        : never)

  type ErrorType = Errors.GlobalErrorType
}

export class InvalidAbiParameterError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidAbiParameterError'

  constructor({ param }: { param: string | object }) {
    super('Failed to parse ABI parameter.', {
      details: `parseAbiParameter(${JSON.stringify(param, null, 2)})`,
    })
  }
}

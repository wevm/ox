import type * as abitype from 'abitype'

import * as Errors from './Errors.js'
import type { AssertName } from './internal/humanReadable/types/signatures.js'
import type { Modifier } from './internal/humanReadable/types/signatures.js'
import * as internal_regex from './internal/regex.js'
import type { IsNarrowable, Join } from './internal/types.js'

/** Root type for ABI parameters. */
export type AbiParameter = abitype.AbiParameter

/**
 *
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
                } & (IsNarrowable<components[key]['name'], string> extends true
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
        } & (IsNarrowable<name, string> extends true
          ? { name: name }
          : unknown) &
          (IsNarrowable<indexed, boolean> extends true
            ? { indexed: indexed }
            : unknown)
      >
    : `${abiParameter['type']}${abiParameter extends { indexed: true }
        ? ' indexed'
        : ''}${abiParameter['name'] extends infer name extends string
        ? name extends ''
          ? ''
          : ` ${AssertName<name>}`
        : ''}`

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

export class InvalidAbiParametersError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidAbiParametersError'

  constructor({ params }: { params: string | object }) {
    super('Failed to parse ABI parameters.', {
      details: `parseAbiParameters(${JSON.stringify(params, null, 2)})`,
    })
  }
}

export class InvalidParameterError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidParameterError'

  constructor({ param }: { param: string }) {
    super('Invalid ABI parameter.', {
      details: param,
    })
  }
}

export class SolidityProtectedKeywordError extends Errors.BaseError {
  override readonly name = 'AbiParameter.SolidityProtectedKeywordError'

  constructor({ param, name }: { param: string; name: string }) {
    super('Invalid ABI parameter.', {
      details: param,
      metaMessages: [
        `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`,
      ],
    })
  }
}

export class InvalidModifierError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidModifierError'

  constructor({
    param,
    type,
    modifier,
  }: {
    param: string
    type?: abitype.AbiItemType | 'struct' | undefined
    modifier: Modifier
  }) {
    super('Invalid ABI parameter.', {
      details: param,
      metaMessages: [
        `Modifier "${modifier}" not allowed${
          type ? ` in "${type}" type` : ''
        }.`,
      ],
    })
  }
}

export class InvalidFunctionModifierError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidFunctionModifierError'

  constructor({
    param,
    type,
    modifier,
  }: {
    param: string
    type?: abitype.AbiItemType | 'struct' | undefined
    modifier: Modifier
  }) {
    super('Invalid ABI parameter.', {
      details: param,
      metaMessages: [
        `Modifier "${modifier}" not allowed${
          type ? ` in "${type}" type` : ''
        }.`,
        `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`,
      ],
    })
  }
}

export class InvalidAbiTypeParameterError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidAbiTypeParameterError'

  constructor({
    abiParameter,
  }: {
    abiParameter: AbiParameter & { indexed?: boolean | undefined }
  }) {
    super('Invalid ABI parameter.', {
      details: JSON.stringify(abiParameter, null, 2),
      metaMessages: ['ABI parameter type is invalid.'],
    })
  }
}

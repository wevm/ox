import type { AbiItemType, AbiParameter } from 'abitype'
import { BaseError } from '../../Errors.js'
import type { Modifier } from './types/signatures.js'

export class InvalidAbiItemError extends BaseError {
  override name = 'AbiItem.InvalidAbiItemError'

  constructor({ signature }: { signature: string | object }) {
    super('Failed to parse ABI item.', {
      details: `parseAbiItem(${JSON.stringify(signature, null, 2)})`,
      docsPath: '/api/AbiItem/from',
    })
  }
}

export class UnknownTypeError extends BaseError {
  override name = 'HumanReadableAbi.UnknownTypeError'

  constructor({ type }: { type: string }) {
    super('Unknown type.', {
      metaMessages: [
        `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`,
      ],
    })
  }
}

export class UnknownSolidityTypeError extends BaseError {
  override name = 'HumanReadableAbi.UnknownSolidityTypeError'

  constructor({ type }: { type: string }) {
    super('Unknown type.', {
      metaMessages: [`Type "${type}" is not a valid ABI type.`],
    })
  }
}

export class InvalidAbiParameterError extends BaseError {
  override name = 'AbiParameter.InvalidAbiParameterError'

  constructor({ param }: { param: string | object }) {
    super('Failed to parse ABI parameter.', {
      details: `parseAbiParameter(${JSON.stringify(param, null, 2)})`,
      docsPath: '/api/AbiParameter/from',
    })
  }
}

export class InvalidAbiParametersError extends BaseError {
  override name = 'AbiParameters.InvalidAbiParametersError'

  constructor({ params }: { params: string | object }) {
    super('Failed to parse ABI parameters.', {
      details: `parseAbiParameters(${JSON.stringify(params, null, 2)})`,
      docsPath: '/api/AbiParameters/from',
    })
  }
}

export class InvalidParameterError extends BaseError {
  override name = 'HumanReadableAbi.InvalidParameterError'

  constructor({ param }: { param: string }) {
    super('Invalid ABI parameter.', {
      details: param,
    })
  }
}

export class SolidityProtectedKeywordError extends BaseError {
  override name = 'HumanReadableAbi.SolidityProtectedKeywordError'

  constructor({ param, name }: { param: string; name: string }) {
    super('Invalid ABI parameter.', {
      details: param,
      metaMessages: [
        `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`,
      ],
    })
  }
}

export class InvalidModifierError extends BaseError {
  override name = 'HumanReadableAbi.InvalidModifierError'

  constructor({
    param,
    type,
    modifier,
  }: {
    param: string
    type?: AbiItemType | 'struct' | undefined
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

export class InvalidFunctionModifierError extends BaseError {
  override name = 'HumanReadableAbi.InvalidFunctionModifierError'

  constructor({
    param,
    type,
    modifier,
  }: {
    param: string
    type?: AbiItemType | 'struct' | undefined
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

export class InvalidAbiTypeParameterError extends BaseError {
  override name = 'HumanReadableAbi.InvalidAbiTypeParameterError'

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

export class InvalidSignatureError extends BaseError {
  override name = 'Abi.InvalidSignatureError'

  constructor({
    signature,
    type,
  }: {
    signature: string
    type: AbiItemType | 'struct'
  }) {
    super(`Invalid ${type} signature.`, {
      details: signature,
    })
  }
}

export class UnknownSignatureError extends BaseError {
  override name = 'Abi.UnknownSignatureError'

  constructor({ signature }: { signature: string }) {
    super('Unknown signature.', {
      details: signature,
    })
  }
}

export class InvalidStructSignatureError extends BaseError {
  override name = 'Abi.InvalidStructSignatureError'

  constructor({ signature }: { signature: string }) {
    super('Invalid struct signature.', {
      details: signature,
      metaMessages: ['No properties exist.'],
    })
  }
}

export class InvalidParenthesisError extends BaseError {
  override name = 'HumanReadableAbi.InvalidParenthesisError'

  constructor({ current, depth }: { current: string; depth: number }) {
    super('Unbalanced parentheses.', {
      metaMessages: [
        `"${current.trim()}" has too many ${
          depth > 0 ? 'opening' : 'closing'
        } parentheses.`,
      ],
      details: `Depth "${depth}"`,
    })
  }
}

export class CircularReferenceError extends BaseError {
  override name = 'Abi.CircularReferenceError'

  constructor({ type }: { type: string }) {
    super('Circular reference detected.', {
      metaMessages: [`Struct "${type}" is a circular reference.`],
    })
  }
}

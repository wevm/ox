import type * as abitype from 'abitype'

import type * as AbiParameter from '../../AbiParameter.js'
import * as Errors from '../../Errors.js'
import type { Modifier } from './signatures.js'

export class InvalidAbiItemError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidAbiItemError'

  constructor({ signature }: { signature: string | object }) {
    super('Failed to parse ABI item.', {
      details: `parseAbiItem(${JSON.stringify(signature, null, 2)})`,
    })
  }
}

export class UnknownTypeError extends Errors.BaseError {
  override readonly name = 'AbiParameter.UnknownTypeError'

  constructor({ type }: { type: string }) {
    super('Unknown type.', {
      metaMessages: [
        `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`,
      ],
    })
  }
}

export class UnknownSolidityTypeError extends Errors.BaseError {
  override readonly name = 'AbiParameter.UnknownSolidityTypeError'

  constructor({ type }: { type: string }) {
    super('Unknown type.', {
      metaMessages: [`Type "${type}" is not a valid ABI type.`],
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
    abiParameter: AbiParameter.AbiParameter & { indexed?: boolean | undefined }
  }) {
    super('Invalid ABI parameter.', {
      details: JSON.stringify(abiParameter, null, 2),
      metaMessages: ['ABI parameter type is invalid.'],
    })
  }
}

export class InvalidSignatureError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidSignatureError'

  constructor({
    signature,
    type,
  }: {
    signature: string
    type: abitype.AbiItemType | 'struct'
  }) {
    super(`Invalid ${type} signature.`, {
      details: signature,
    })
  }
}

export class UnknownSignatureError extends Errors.BaseError {
  override readonly name = 'AbiParameter.UnknownSignatureError'

  constructor({ signature }: { signature: string }) {
    super('Unknown signature.', {
      details: signature,
    })
  }
}

export class InvalidStructSignatureError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidStructSignatureError'

  constructor({ signature }: { signature: string }) {
    super('Invalid struct signature.', {
      details: signature,
      metaMessages: ['No properties exist.'],
    })
  }
}

export class InvalidParenthesisError extends Errors.BaseError {
  override readonly name = 'AbiParameter.InvalidParenthesisError'

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

export class CircularReferenceError extends Errors.BaseError {
  override readonly name = 'AbiParameter.CircularReferenceError'

  constructor({ type }: { type: string }) {
    super('Circular reference detected.', {
      metaMessages: [`Struct "${type}" is a circular reference.`],
    })
  }
}

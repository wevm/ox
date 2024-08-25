import { size } from '../hex/size.js'
import { toHex } from '../hex/toHex.js'
import { stringify } from '../stringify.js'
import type { Bytes, Hex } from '../types/data.js'
import { BaseError } from './base.js'

export class InvalidSerializedSignatureSizeError extends BaseError {
  override readonly name = 'InvalidSerializedSignatureSizeError'

  constructor({ signature }: { signature: Hex | Bytes }) {
    super(
      `Value \`${signature}\` is an invalid signature size. Expected: 64 (compact) or 65 bytes. Received ${size(toHex(signature))} bytes.`,
      { docsPath: '/errors#invalidserializedsignaturesizeerror' },
    )
  }
}

export class MissingSignaturePropertiesError extends BaseError {
  override readonly name = 'MissingSignaturePropertiesError'

  constructor({ signature }: { signature: unknown }) {
    super(
      `Signature \`${stringify(signature)}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.`,
      {
        docsPath: '/errors#missingsignaturepropertieserror',
      },
    )
  }
}

export class InvalidSignatureRError extends BaseError {
  override readonly name = 'InvalidSignatureRError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid r value. r must be a positive integer less than 2^256.`,
    )
  }
}

export class InvalidSignatureSError extends BaseError {
  override readonly name = 'InvalidSignatureSError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid s value. s must be a positive integer less than 2^256.`,
    )
  }
}

export class InvalidSignatureYParityError extends BaseError {
  override readonly name = 'InvalidSignatureYParityError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid y-parity value. Y-parity must be 0 or 1.`,
      {
        docsPath: '/errors#invalidsignatureyparityerror',
      },
    )
  }
}

export class InvalidSignatureVError extends BaseError {
  override readonly name = 'InvalidSignatureVError'

  constructor({ value }: { value: number }) {
    super(
      `Value \`${value}\` is an invalid v value. v must be 27, 28 or >=35.`,
      {
        docsPath: '/errors#invalidsignatureverror',
      },
    )
  }
}

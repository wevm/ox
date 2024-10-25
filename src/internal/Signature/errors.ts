import type { Bytes } from '../Bytes/types.js'
import { BaseError } from '../Errors/base.js'
import { from } from '../Hex/from.js'
import { size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'
import { stringify } from '../Json/stringify.js'

/** Thrown when the serialized signature is of an invalid size. */
export class Signature_InvalidSerializedSizeError extends BaseError {
  override readonly name = 'Signature.InvalidSerializedSizeError'

  constructor({ signature }: { signature: Hex | Bytes }) {
    super(`Value \`${signature}\` is an invalid signature size.`, {
      docsPath: '/errors#invalidserializedsignaturesizeerror',
      metaMessages: [
        'Expected: 64 bytes or 65 bytes.',
        `Received ${size(from(signature))} bytes.`,
      ],
    })
  }
}

/** Thrown when the signature is missing either an `r`, `s`, or `yParity` property. */
export class Signature_MissingPropertiesError extends BaseError {
  override readonly name = 'Signature.MissingPropertiesError'

  constructor({ signature }: { signature: unknown }) {
    super(
      `Signature \`${stringify(signature)}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.`,
      {
        docsPath: '/errors#missingsignaturepropertieserror',
      },
    )
  }
}

/** Thrown when the signature has an invalid `r` value. */
export class Signature_InvalidRError extends BaseError {
  override readonly name = 'Signature.InvalidRError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid r value. r must be a positive integer less than 2^256.`,
    )
  }
}

/** Thrown when the signature has an invalid `s` value. */
export class Signature_InvalidSError extends BaseError {
  override readonly name = 'Signature.InvalidSError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid s value. s must be a positive integer less than 2^256.`,
    )
  }
}

/** Thrown when the signature has an invalid `yParity` value. */
export class Signature_InvalidYParityError extends BaseError {
  override readonly name = 'Signature.InvalidYParityError'

  constructor({ value }: { value: unknown }) {
    super(
      `Value \`${value}\` is an invalid y-parity value. Y-parity must be 0 or 1.`,
      {
        docsPath: '/errors#invalidsignatureyparityerror',
      },
    )
  }
}

/** Thrown when the signature has an invalid `v` value. */
export class Signature_InvalidVError extends BaseError {
  override readonly name = 'Signature.InvalidVError'

  constructor({ value }: { value: number }) {
    super(
      `Value \`${value}\` is an invalid v value. v must be 27, 28 or >=35.`,
      {
        docsPath: '/errors#invalidsignatureverror',
      },
    )
  }
}

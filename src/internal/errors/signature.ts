import { size } from '../data/size.js'
import type { Bytes, Hex } from '../types/data.js'
import { BaseError } from './base.js'

export class InvalidSerializedSignatureSizeError extends BaseError {
  override readonly name = 'InvalidSerializedSignatureSizeError'

  constructor({ signature }: { signature: Hex | Bytes }) {
    super(
      `Value \`${signature}\` is an invalid signature size. Expected: 64 (compact) or 65 bytes. Received ${size(signature)} bytes.`,
      { docsPath: '/errors#invalidserializedsignaturesizeerror' },
    )
  }
}
export class InvalidSignatureYParityError extends BaseError {
  override readonly name = 'InvalidSignatureYParityError'

  constructor({ value }: { value: number }) {
    super(`Value \`${value}\` is an invalid y-parity value.`, {
      docsPath: '/errors#invalidsignatureyparityerror',
    })
  }
}

export class InvalidSignatureVError extends BaseError {
  override readonly name = 'InvalidSignatureVError'

  constructor({ value }: { value: number }) {
    super(`Value \`${value}\` is an invalid v value.`, {
      docsPath: '/errors#invalidsignatureverror',
    })
  }
}

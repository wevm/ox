import { secp256k1 } from '@noble/curves/secp256k1'

import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Signs the payload with the provided private key.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 * ```
 */
export function sign(parameters: sign.Parameters): sign.ReturnType {
  const { payload, privateKey } = parameters
  const { r, s, recovery } = secp256k1.sign(
    toBytes(payload),
    toBytes(privateKey),
  )
  return {
    r,
    s,
    yParity: recovery as 0 | 1,
  }
}

export declare namespace sign {
  type Parameters = {
    /** Payload to sign. */
    payload: Hex | Bytes
    /** ECDSA private key. */
    privateKey: Hex | Bytes
  }

  type ReturnType = Compute<Signature>

  type ErrorType = toBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
sign.parseError = (error: unknown) => error as sign.ErrorType

import * as Bytes from '../Bytes.js'
import type * as Errors from '../Errors.js'
import * as Hash from '../Hash.js'

/** @internal */
export function derive(
  seed: Bytes.Bytes,
  domain: Bytes.Bytes,
  options: derive.Options = {},
): Bytes.Bytes {
  const { validate } = options
  for (let counter = 0; ; counter++) {
    const key = Hash.hmac256(
      seed,
      Bytes.concat(domain, Bytes.fromNumber(counter, { size: 4 })),
      { as: 'Bytes' },
    )
    if (!validate || validate(key)) return key
    key.fill(0)
  }
}

export declare namespace derive {
  type Options = {
    validate?: ((key: Bytes.Bytes) => boolean) | undefined
  }

  type ErrorType =
    | Bytes.concat.ErrorType
    | Bytes.fromNumber.ErrorType
    | Hash.hmac256.ErrorType
    | Errors.GlobalErrorType
}

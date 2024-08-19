import type { TypedData } from 'abitype'

import { BaseError } from './base.js'

export class InvalidPrimaryTypeError extends BaseError {
  override readonly name = 'InvalidPrimaryTypeError'

  constructor({
    primaryType,
    types,
  }: { primaryType: string; types: TypedData | Record<string, unknown> }) {
    super(
      `Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`,
      {
        docsPath: '/errors#invalidprimarytypeerror',
        metaMessages: ['Check that the primary type is a key in `types`.'],
      },
    )
  }
}

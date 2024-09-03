import { type Abi, formatAbiItem } from 'abitype'
import { normalizeSignature } from '../AbiItem/getSignature.js'
import { BaseError } from '../Errors/base.js'

export class AbiItemAmbiguityError extends BaseError {
  override readonly name = 'AbiItemAmbiguityError'
  constructor(
    x: { abiItem: Abi[number]; type: string },
    y: { abiItem: Abi[number]; type: string },
  ) {
    super('Found ambiguous types in overloaded ABI Items.', {
      docsPath: '/errors#abiitemambiguityerror',
      metaMessages: [
        // TODO: abitype to add support for signature-formatted ABI items.
        `\`${x.type}\` in \`${normalizeSignature(formatAbiItem(x.abiItem))}\`, and`,
        `\`${y.type}\` in \`${normalizeSignature(formatAbiItem(y.abiItem))}\``,
        '',
        'These types encode differently and cannot be distinguished at runtime.',
        'Remove one of the ambiguous items in the ABI.',
      ],
    })
  }
}

export class AbiItemNotFoundError extends BaseError {
  override readonly name = 'AbiItemNotFoundError'
  constructor(name: string) {
    super(`ABI Item "${name}" not found.`, {
      docsPath: '/errors#abiitemnotfounderror',
    })
  }
}

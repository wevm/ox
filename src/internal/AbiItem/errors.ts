import { type Abi, formatAbiItem } from 'abitype'
import { normalizeSignature } from '../AbiItem/getSignature.js'
import { BaseError } from '../Errors/base.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

export class AbiItem_AmbiguityError extends BaseError {
  override readonly name = 'AbiItem.AmbiguityError'
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

export class AbiItem_NotFoundError extends BaseError {
  override readonly name = 'AbiItem.NotFoundError'
  constructor({
    name,
    data,
    type = 'item',
  }: {
    name?: string | undefined
    data?: Hex | undefined
    type?: string | undefined
  }) {
    const selector = (() => {
      if (name) return ` with name "${name}"`
      if (data) return ` with data "${data}"`
      return ''
    })()
    super(`ABI ${type}${selector} not found.`, {
      docsPath: '/errors#abiitemnotfounderror',
    })
  }
}

export class AbiItem_InvalidSelectorSizeError extends BaseError {
  override readonly name = 'AbiItem.InvalidSelectorSizeError'
  constructor({ data }: { data: Hex }) {
    super(
      `Selector size is invalid. Expected 4 bytes. Received ${Hex_size(data)} bytes ("${data}").`,
      {
        docsPath: '/errors#abiiteminvalidselectorsizeerror',
      },
    )
  }
}

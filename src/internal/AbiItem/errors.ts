import { type Abi, formatAbiItem } from 'abitype'
import { normalizeSignature } from '../AbiItem/getSignature.js'
import { BaseError } from '../Errors/base.js'
import { size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

/**
 * Throws when ambiguous types are found on overloaded ABI items.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from(['function foo(address)', 'function foo(bytes20)'])
 * AbiFunction.fromAbi(foo, 'foo', {
 *   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
 * })
 * // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
 * // @error: `bytes20` in `foo(bytes20)`, and
 * // @error: `address` in `foo(address)`
 * // @error: These types encode differently and cannot be distinguished at runtime.
 * // @error: Remove one of the ambiguous items in the ABI.
 * ```
 *
 * ### Solution
 *
 * Remove one of the ambiguous types from the ABI.
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function foo(bytes20)' // [!code --]
 * ])
 * AbiFunction.fromAbi(foo, 'foo', {
 *   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
 * })
 * // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
 * // @error: `bytes20` in `foo(bytes20)`, and
 * // @error: `address` in `foo(address)`
 * // @error: These types encode differently and cannot be distinguished at runtime.
 * // @error: Remove one of the ambiguous items in the ABI.
 * ```
 */
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

/**
 * Throws when an ABI item is not found in the ABI.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbi(foo, 'baz')
 * // @error: AbiItem.NotFoundError: ABI function with name "baz" not found.
 * ```
 *
 * ### Solution
 *
 * Ensure the ABI item exists on the ABI.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)',
 *   'function baz(bool)' // [!code ++]
 * ])
 * AbiFunction.fromAbi(foo, 'baz')
 * ```
 */
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

/**
 * Throws when the selector size is invalid.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbi(foo, '0xaaa')
 * // @error: AbiItem.InvalidSelectorSizeError: Selector size is invalid. Expected 4 bytes. Received 2 bytes ("0xaaa").
 * ```
 *
 * ### Solution
 *
 * Ensure the selector size is 4 bytes.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiFunction } from 'ox'
 *
 * const foo = Abi.from([
 *   'function foo(address)',
 *   'function bar(uint)'
 * ])
 * AbiFunction.fromAbi(foo, '0x7af82b1a')
 * ```
 */
export class AbiItem_InvalidSelectorSizeError extends BaseError {
  override readonly name = 'AbiItem.InvalidSelectorSizeError'
  constructor({ data }: { data: Hex }) {
    super(
      `Selector size is invalid. Expected 4 bytes. Received ${size(data)} bytes ("${data}").`,
      {
        docsPath: '/errors#abiiteminvalidselectorsizeerror',
      },
    )
  }
}

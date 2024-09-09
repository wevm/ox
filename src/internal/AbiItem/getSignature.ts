import { formatAbiItem } from 'abitype'

import { BaseError } from '../Errors/base.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { AbiItem } from './types.js'

/**
 * Computes the stringified signature for a given {@link ox#AbiItem.AbiItem}.
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const signature = AbiItem.getSignature('function ownerOf(uint256 tokenId)')
 * // @log: 'ownerOf(uint256)'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const signature = AbiItem.getSignature({
 *   name: 'ownerOf',
 *   type: 'function',
 *   inputs: [{ name: 'tokenId', type: 'uint256' }],
 *   outputs: [],
 *   stateMutability: 'view',
 * })
 * // @log: 'ownerOf(uint256)'
 * ```
 *
 * @param abiItem - The ABI Item to compute the signature for.
 * @returns The stringified signature of the ABI Item.
 */
export function AbiItem_getSignature(abiItem: string | AbiItem): string {
  const signature = (() => {
    if (typeof abiItem === 'string') return abiItem
    return formatAbiItem(abiItem)
  })()
  return normalizeSignature(signature)
}

export declare namespace AbiItem_getSignature {
  type ErrorType = normalizeSignature.ErrorType | GlobalErrorType
}

/* v8 ignore next */
AbiItem_getSignature.parseError = (error: unknown) =>
  error as AbiItem_getSignature.ErrorType

///////////////////////////////////////////////////////////////////////////
// Utilities
///////////////////////////////////////////////////////////////////////////

/** @internal */
export function normalizeSignature(signature: string): string {
  let active = true
  let current = ''
  let level = 0
  let result = ''
  let valid = false

  for (let i = 0; i < signature.length; i++) {
    const char = signature[i]!

    // If the character is a separator, we want to reactivate.
    if (['(', ')', ','].includes(char)) active = true

    // If the character is a "level" token, we want to increment/decrement.
    if (char === '(') level++
    if (char === ')') level--

    // If we aren't active, we don't want to mutate the result.
    if (!active) continue

    // If level === 0, we are at the definition level.
    if (level === 0) {
      if (char === ' ' && ['event', 'function', 'error', ''].includes(result))
        result = ''
      else {
        result += char

        // If we are at the end of the definition, we must be finished.
        if (char === ')') {
          valid = true
          break
        }
      }

      continue
    }

    // Ignore spaces
    if (char === ' ') {
      // If the previous character is a separator, and the current section isn't empty, we want to deactivate.
      if (signature[i - 1] !== ',' && current !== ',' && current !== ',(') {
        current = ''
        active = false
      }
      continue
    }

    result += char
    current += char
  }

  if (!valid) throw new BaseError('Unable to normalize signature.')

  return result
}

/** @internal */
export declare namespace normalizeSignature {
  export type ErrorType = BaseError | GlobalErrorType
}

import { type Abi, formatAbiItem } from 'abitype'
import { BaseError } from '../errors/base.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Computes the stringified signature for a given ABI Item.
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const signature = Abi.getSignature('function ownerOf(uint256 tokenId)')
 * // 'ownerOf(uint256)'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const signature = Abi.getSignature({
 *   name: 'ownerOf',
 *   type: 'function',
 *   inputs: [{ name: 'tokenId', type: 'uint256' }],
 *   outputs: [],
 *   stateMutability: 'view',
 * })
 * // 'ownerOf(uint256)'
 * ```
 */
export const getSignature = (abiItem: getSignature.Parameters) => {
  const signature = (() => {
    if (typeof abiItem === 'string') return abiItem
    return formatAbiItem(abiItem)
  })()
  return normalizeSignature(signature)
}

export declare namespace getSignature {
  type Parameters = string | Abi[number]

  type ErrorType = normalizeSignature.ErrorType | GlobalErrorType
}

getSignature.parseError = (error: unknown) => error as getSignature.ErrorType

///////////////////////////////////////////////////////////////////////////
// Utilities
///////////////////////////////////////////////////////////////////////////

export declare namespace normalizeSignature {
  export type ErrorType = BaseError | GlobalErrorType
}

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
      if (char === ' ' && ['event', 'function', ''].includes(result))
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

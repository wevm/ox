/**
 * Zod utilities.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const value = z.decode(z.Uint256, '0x2a')
 * const signature = z.decode(z.Signature.Signature, {
 *   r: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   s: '0x0000000000000000000000000000000000000000000000000000000000000002',
 *   yParity: '0x1'
 * })
 * ```
 *
 * @category Zod
 * @entrypointCategory Zod
 */
export * as z from './z.js'

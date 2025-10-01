/** @entrypointCategory ERCs */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc
export type {}

/**
 * Utility functions for encoding and decoding [ERC-7821](https://eips.ethereum.org/EIPS/eip-7821) calls.
 *
 * @example
 * ### Encoding calls
 *
 * Calls can be encoded using `Calls.encode`.
 *
 * ```ts twoslash
 * import { Calls } from 'ox/erc7821'
 *
 * const calls = Calls.encode([
 *   {
 *     data: '0xcafebabe',
 *     to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *     value: 1n,
 *   }
 * ])
 * ```
 *
 * @example
 * ### Decoding calls
 *
 * Calls can be decoded using `Calls.decode`.
 *
 * ```ts twoslash
 * import { Calls } from 'ox/erc7821'
 *
 * const { calls } = Calls.decode('0x...')
 * ```
 *
 * @category ERC-7821
 */
export * as Calls from './Calls.js'

/**
 * Utility functions for encoding and decoding [ERC-7821](https://eips.ethereum.org/EIPS/eip-7821) `execute` function data.
 *
 * @example
 * ### Encoding `execute` Function Data
 *
 * The `execute` function data can be encoded using `Execute.encodeData`.
 *
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const data = Execute.encodeData([
 *   {
 *     data: '0xcafebabe',
 *     to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
 *     value: 1n,
 *   }
 * ])
 * ```
 *
 * @example
 * ### Decoding `execute` Function Data
 *
 * The `execute` function data can be decoded using `Execute.decodeData`.
 *
 * ```ts twoslash
 * import { Execute } from 'ox/erc7821'
 *
 * const { calls } = Execute.decodeData('0xe9ae5c53...')
 * ```
 *
 * @category ERC-7821
 */
export * as Execute from './Execute.js'

/** @entrypointCategory ERCs */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc
export type {}

/**
 * Utility functions for working with [ERC-8021 Transaction Attribution](https://eip.tools/eip/8021).
 *
 * @example
 * ### Converting an Attribution to Data Suffix
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const dataSuffix1 = Attribution.toDataSuffix({
 *   codes: ['baseapp']
 * })
 *
 * const dataSuffix2 = Attribution.toDataSuffix({
 *   codes: ['baseapp', 'morpho'],
 *   codeRegistryAddress: '0x...'
 * })
 * ```
 *
 * @example
 * ### Extracting an Attribution from Calldata
 *
 * ```ts twoslash
 * import { Attribution } from 'ox/erc8021'
 *
 * const attribution = Attribution.fromData('0x...')
 *
 * console.log(attribution)
 * // @log: { codes: ['baseapp', 'morpho'], codeRegistryAddress: '0x...' }
 * ```
 *
 * @category ERC-8021
 */
export * as Attribution from './Attribution.js'

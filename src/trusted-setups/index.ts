/**
 * File-system paths for trusted setup files bundled with Ox.
 */
export * as Paths from './Paths.js'

/**
 * Trusted setup data bundled with Ox.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Setups } from 'ox/trusted-setups'
 * import { Kzg } from 'ox/wasm'
 *
 * const kzg = await Kzg.create({ trustedSetup: Setups.mainnet })
 *
 * kzg.dispose()
 * ```
 */
export * as Setups from './Setups.js'

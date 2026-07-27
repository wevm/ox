import { mnemonicToSeedSync } from '@scure/bip39'
import { type Complete, type Mnemonic, overrides } from './engine.js'

/**
 * Resolvers for the `Mnemonic` slot, and ox's defaults for it, backed by
 * `@scure/bip39`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

const toSeedDefault: Complete<Mnemonic>['toSeed'] = (mnemonic, passphrase) =>
  mnemonicToSeedSync(mnemonic, passphrase)

/** @internal */
export const toSeed: Complete<Mnemonic>['toSeed'] = (mnemonic, passphrase) =>
  (overrides.Mnemonic?.toSeed ?? toSeedDefault)(mnemonic, passphrase)

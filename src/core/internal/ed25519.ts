import { ed25519 } from '@noble/curves/ed25519.js'
import { type Complete, type Eddsa, overrides } from './engine.js'

/**
 * Resolvers for the `Ed25519` slot, and ox's defaults for it, backed by
 * `@noble/curves`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

const getPublicKeyDefault: Complete<Eddsa>['getPublicKey'] = (privateKey) =>
  ed25519.getPublicKey(privateKey)

const randomSecretKeyDefault: Complete<Eddsa>['randomSecretKey'] = () =>
  ed25519.utils.randomSecretKey()

const signDefault: Complete<Eddsa>['sign'] = (payload, privateKey) =>
  ed25519.sign(payload, privateKey)

const toMontgomeryDefault: Complete<Eddsa>['toMontgomery'] = (publicKey) =>
  ed25519.utils.toMontgomery(publicKey)

const toMontgomerySecretDefault: Complete<Eddsa>['toMontgomerySecret'] = (
  privateKey,
) => ed25519.utils.toMontgomerySecret(privateKey)

const verifyDefault: Complete<Eddsa>['verify'] = (
  signature,
  payload,
  publicKey,
) => ed25519.verify(signature, payload, publicKey)

/** @internal */
export const getPublicKey: Complete<Eddsa>['getPublicKey'] = (privateKey) =>
  (overrides.Ed25519?.getPublicKey ?? getPublicKeyDefault)(privateKey)

/** @internal */
export const randomSecretKey: Complete<Eddsa>['randomSecretKey'] = () =>
  (overrides.Ed25519?.randomSecretKey ?? randomSecretKeyDefault)()

/** @internal */
export const sign: Complete<Eddsa>['sign'] = (payload, privateKey) =>
  (overrides.Ed25519?.sign ?? signDefault)(payload, privateKey)

/** @internal */
export const toMontgomery: Complete<Eddsa>['toMontgomery'] = (publicKey) =>
  (overrides.Ed25519?.toMontgomery ?? toMontgomeryDefault)(publicKey)

/** @internal */
export const toMontgomerySecret: Complete<Eddsa>['toMontgomerySecret'] = (
  privateKey,
) =>
  (overrides.Ed25519?.toMontgomerySecret ?? toMontgomerySecretDefault)(
    privateKey,
  )

/** @internal */
export const verify: Complete<Eddsa>['verify'] = (
  signature,
  payload,
  publicKey,
) => (overrides.Ed25519?.verify ?? verifyDefault)(signature, payload, publicKey)

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { type Complete, type Ecdsa, overrides } from './engine.js'

/**
 * Resolvers for the `Secp256k1` slot, and ox's defaults for it, backed by
 * `@noble/curves`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site. `lowS` and the recovered signature format are
 * pinned here rather than in the contract, so an engine cannot opt out of them.
 */

const getPublicKeyDefault: Complete<Ecdsa>['getPublicKey'] = (privateKey) =>
  secp256k1.getPublicKey(privateKey, false)

const getSharedSecretDefault: Complete<Ecdsa>['getSharedSecret'] = (
  privateKey,
  publicKey,
) => secp256k1.getSharedSecret(privateKey, publicKey, true)

const randomSecretKeyDefault: Complete<Ecdsa>['randomSecretKey'] = () =>
  secp256k1.utils.randomSecretKey()

const recoverPublicKeyDefault: Complete<Ecdsa>['recoverPublicKey'] = (
  signature,
  payload,
) =>
  secp256k1.Signature.fromBytes(signature, 'recovered')
    .recoverPublicKey(payload)
    .toBytes(false)

const signDefault: Complete<Ecdsa>['sign'] = (payload, privateKey, options) =>
  secp256k1.sign(payload, privateKey, {
    ...options,
    format: 'recovered',
    lowS: true,
  })

const verifyDefault: Complete<Ecdsa>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) => secp256k1.verify(signature, payload, publicKey, { ...options, lowS: true })

/** @internal */
export const getPublicKey: Complete<Ecdsa>['getPublicKey'] = (privateKey) =>
  (overrides.Secp256k1?.getPublicKey ?? getPublicKeyDefault)(privateKey)

/** @internal */
export const getSharedSecret: Complete<Ecdsa>['getSharedSecret'] = (
  privateKey,
  publicKey,
) =>
  (overrides.Secp256k1?.getSharedSecret ?? getSharedSecretDefault)(
    privateKey,
    publicKey,
  )

/** @internal */
export const randomSecretKey: Complete<Ecdsa>['randomSecretKey'] = () =>
  (overrides.Secp256k1?.randomSecretKey ?? randomSecretKeyDefault)()

/** @internal */
export const recoverPublicKey: Complete<Ecdsa>['recoverPublicKey'] = (
  signature,
  payload,
) =>
  (overrides.Secp256k1?.recoverPublicKey ?? recoverPublicKeyDefault)(
    signature,
    payload,
  )

/** @internal */
export const sign: Complete<Ecdsa>['sign'] = (payload, privateKey, options) =>
  (overrides.Secp256k1?.sign ?? signDefault)(payload, privateKey, options)

/** @internal */
export const verify: Complete<Ecdsa>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) =>
  (overrides.Secp256k1?.verify ?? verifyDefault)(
    signature,
    payload,
    publicKey,
    options,
  )

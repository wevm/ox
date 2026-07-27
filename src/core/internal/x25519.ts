import { x25519 } from '@noble/curves/ed25519.js'
import { type Complete, type Ecdh, overrides } from './engine.js'

/**
 * Resolvers for the `X25519` slot, and ox's defaults for it, backed by
 * `@noble/curves`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

const getPublicKeyDefault: Complete<Ecdh>['getPublicKey'] = (privateKey) =>
  x25519.getPublicKey(privateKey)

const getSharedSecretDefault: Complete<Ecdh>['getSharedSecret'] = (
  privateKey,
  publicKey,
) => x25519.getSharedSecret(privateKey, publicKey)

const randomSecretKeyDefault: Complete<Ecdh>['randomSecretKey'] = () =>
  x25519.utils.randomSecretKey()

/** @internal */
export const getPublicKey: Complete<Ecdh>['getPublicKey'] = (privateKey) =>
  (overrides.X25519?.getPublicKey ?? getPublicKeyDefault)(privateKey)

/** @internal */
export const getSharedSecret: Complete<Ecdh>['getSharedSecret'] = (
  privateKey,
  publicKey,
) =>
  (overrides.X25519?.getSharedSecret ?? getSharedSecretDefault)(
    privateKey,
    publicKey,
  )

/** @internal */
export const randomSecretKey: Complete<Ecdh>['randomSecretKey'] = () =>
  (overrides.X25519?.randomSecretKey ?? randomSecretKeyDefault)()

import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js'
import { randomBytes } from '@noble/post-quantum/utils.js'
import { type Complete, type MlDsa, overrides } from './engine.js'

/**
 * Resolvers for the `MlDsa44` slot, and ox's defaults for it, backed by
 * `@noble/post-quantum`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

const getPublicKeyDefault: Complete<MlDsa>['getPublicKey'] = (privateKey) => {
  const { publicKey, secretKey } = ml_dsa44.keygen(privateKey)
  secretKey.fill(0)
  return publicKey
}

const randomSecretKeyDefault: Complete<MlDsa>['randomSecretKey'] = () =>
  randomBytes(32)

const signDefault: Complete<MlDsa>['sign'] = (payload, privateKey, options) => {
  const { context, extraEntropy } = options
  const { secretKey } = ml_dsa44.keygen(privateKey)
  try {
    // `true` is noble's default (fresh 32 random bytes), spelled by omission.
    return ml_dsa44.sign(payload, secretKey, {
      ...(context ? { context } : {}),
      ...(extraEntropy === true ? {} : { extraEntropy }),
    })
  } finally {
    secretKey.fill(0)
  }
}

const verifyDefault: Complete<MlDsa>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) =>
  ml_dsa44.verify(
    signature,
    payload,
    publicKey,
    options.context ? { context: options.context } : {},
  )

/** @internal */
export const getPublicKey: Complete<MlDsa>['getPublicKey'] = (privateKey) =>
  (overrides.MlDsa44?.getPublicKey ?? getPublicKeyDefault)(privateKey)

/** @internal */
export const randomSecretKey: Complete<MlDsa>['randomSecretKey'] = () =>
  (overrides.MlDsa44?.randomSecretKey ?? randomSecretKeyDefault)()

/** @internal */
export const sign: Complete<MlDsa>['sign'] = (payload, privateKey, options) =>
  (overrides.MlDsa44?.sign ?? signDefault)(payload, privateKey, options)

/** @internal */
export const verify: Complete<MlDsa>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) =>
  (overrides.MlDsa44?.verify ?? verifyDefault)(
    signature,
    payload,
    publicKey,
    options,
  )

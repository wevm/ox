import { bls12_381 as bls } from '@noble/curves/bls12-381.js'
import { type Bls, type Complete, overrides } from './engine.js'

/**
 * Resolvers for the `Bls` slot, and ox's defaults for it, backed by
 * `@noble/curves`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

// Branching on the group rather than selecting a curve into a variable: the
// two `Point` types are unrelated, so a union of them has no common `add`.
const aggregateDefault: Complete<Bls>['aggregate'] = (points, group) => {
  if (group === 'G1') {
    let point = bls.G1.Point.ZERO
    for (const value of points) point = point.add(bls.G1.Point.fromBytes(value))
    return point.toBytes()
  }
  let point = bls.G2.Point.ZERO
  for (const value of points) point = point.add(bls.G2.Point.fromBytes(value))
  return point.toBytes()
}

const getPublicKeyDefault: Complete<Bls>['getPublicKey'] = (
  privateKey,
  group,
) => {
  const curve = group === 'G1' ? bls.G1 : bls.G2
  return curve.Point.BASE.multiply(
    curve.Point.Fn.fromBytes(privateKey),
  ).toBytes()
}

const randomSecretKeyDefault: Complete<Bls>['randomSecretKey'] = () =>
  bls.utils.randomSecretKey()

const signDefault: Complete<Bls>['sign'] = (payload, privateKey, options) => {
  const { dst, group } = options
  const signatureCurve = group === 'G1' ? bls.G1 : bls.G2
  // The scalar comes from the group the public key lives in, which is the one
  // the signature does not.
  const privateKeyCurve = group === 'G1' ? bls.G2 : bls.G1
  const payloadPoint = signatureCurve.hashToCurve(
    payload,
    dst ? { DST: dst } : undefined,
  )
  return payloadPoint
    .multiply(privateKeyCurve.Point.Fn.fromBytes(privateKey))
    .toBytes()
}

const verifyDefault: Complete<Bls>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) => {
  const { dst, signatureGroup } = options
  const shortSignature = signatureGroup === 'G1'
  const curve = shortSignature ? bls.G1 : bls.G2
  const payloadPoint = curve.hashToCurve(
    payload,
    dst ? { DST: dst } : undefined,
  )
  const pairing = shortSignature
    ? bls.pairingBatch([
        {
          g1: payloadPoint as InstanceType<typeof bls.G1.Point>,
          g2: bls.G2.Point.fromBytes(publicKey),
        },
        {
          g1: bls.G1.Point.fromBytes(signature),
          g2: bls.G2.Point.BASE.negate(),
        },
      ])
    : bls.pairingBatch([
        {
          g1: bls.G1.Point.fromBytes(publicKey).negate(),
          g2: payloadPoint as InstanceType<typeof bls.G2.Point>,
        },
        {
          g1: bls.G1.Point.BASE,
          g2: bls.G2.Point.fromBytes(signature),
        },
      ])
  return bls.fields.Fp12.eql(pairing, bls.fields.Fp12.ONE)
}

/** @internal */
export const aggregate: Complete<Bls>['aggregate'] = (points, group) =>
  (overrides.Bls?.aggregate ?? aggregateDefault)(points, group)

/** @internal */
export const getPublicKey: Complete<Bls>['getPublicKey'] = (
  privateKey,
  group,
) => (overrides.Bls?.getPublicKey ?? getPublicKeyDefault)(privateKey, group)

/** @internal */
export const randomSecretKey: Complete<Bls>['randomSecretKey'] = () =>
  (overrides.Bls?.randomSecretKey ?? randomSecretKeyDefault)()

/** @internal */
export const sign: Complete<Bls>['sign'] = (payload, privateKey, options) =>
  (overrides.Bls?.sign ?? signDefault)(payload, privateKey, options)

/** @internal */
export const verify: Complete<Bls>['verify'] = (
  signature,
  payload,
  publicKey,
  options,
) =>
  (overrides.Bls?.verify ?? verifyDefault)(
    signature,
    payload,
    publicKey,
    options,
  )

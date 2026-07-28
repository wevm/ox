import { bench, describe } from 'vp/test'
import * as Bls from './Bls.js'
import * as BlsPoint from './BlsPoint.js'

const sizes = [1, 10, 100, 1000] as const

const max = Math.max(...sizes)

// Pre-compute the maximum number of public-key points once. Each `getPublicKey`
// call is heavy compared to `aggregate`, so we want only the aggregation cost
// to land in the bench timing window.
const allPublicKeys = Array.from({ length: max }, () =>
  Bls.getPublicKey({ privateKey: Bls.randomPrivateKey() }),
)
const allPublicKeyBytes = allPublicKeys.map(BlsPoint.toBytes)
const allPublicKeyHex = allPublicKeys.map(BlsPoint.toHex)

for (const size of sizes) {
  const points = allPublicKeys.slice(0, size)
  const bytes = allPublicKeyBytes.slice(0, size)
  const hex = allPublicKeyHex.slice(0, size)

  describe(`Bls.aggregate (${size} points)`, () => {
    bench('Object input', () => {
      Bls.aggregate(points)
    })

    bench('Bytes input', () => {
      Bls.aggregate(bytes, { group: 'G1' })
    })

    bench('Hex input', () => {
      Bls.aggregate(hex, { group: 'G1' })
    })
  })
}

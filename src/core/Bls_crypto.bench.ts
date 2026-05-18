import { bench, describe } from 'vitest'
import * as Bls from './Bls.js'

const sizes = [1, 10, 100, 1000] as const

const max = Math.max(...sizes)

// Pre-compute the maximum number of public-key points once. Each `getPublicKey`
// call is heavy compared to `aggregate`, so we want only the aggregation cost
// to land in the bench timing window.
const allPublicKeys = Array.from({ length: max }, () =>
  Bls.getPublicKey({ privateKey: Bls.randomPrivateKey() }),
)

for (const size of sizes) {
  const points = allPublicKeys.slice(0, size)

  describe(`Bls.aggregate (${size} points)`, () => {
    bench('aggregate', () => {
      Bls.aggregate(points)
    })
  })
}

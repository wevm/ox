import { bench, describe } from 'vitest'
import * as Bls from './Bls.js'
import * as Hex from './Hex.js'

const payload = Hex.fromBytes(new Uint8Array(32).fill(0xab))

function makeSignatures(count: number) {
  const signatures: ReturnType<typeof Bls.sign>[] = []
  for (let i = 0; i < count; i++) {
    const privateKey = Bls.randomPrivateKey()
    signatures.push(Bls.sign({ payload, privateKey }))
  }
  return signatures
}

const sig10 = makeSignatures(10)
const sig100 = makeSignatures(100)
const sig1000 = makeSignatures(1000)

describe('Bls.aggregate', () => {
  bench('10 signatures', () => {
    Bls.aggregate(sig10)
  })

  bench('100 signatures', () => {
    Bls.aggregate(sig100)
  })

  bench('1000 signatures', () => {
    Bls.aggregate(sig1000)
  })
})

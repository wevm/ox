import { bench, describe } from 'vp/test'
import * as Secp256k1 from './Secp256k1.js'
import * as Signature from './Signature.js'

const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
const payload =
  '0x0000000000000000000000000000000000000000000000000000000000000123' as const
const publicKey = Secp256k1.getPublicKey({ privateKey })
const signature = Secp256k1.sign({ payload, privateKey })

const tuple = Signature.toTuple(signature)
const recoveredBytes = Signature.toRecoveredBytes(signature)
const compactBytes = Signature.toCompactBytes(signature)

describe('Signature.fromTuple', () => {
  bench('default', () => {
    Signature.fromTuple(tuple)
  })
})

describe('Signature.toTuple', () => {
  bench('default', () => {
    Signature.toTuple(signature)
  })
})

describe('Signature.toRecoveredBytes / fromRecoveredBytes', () => {
  bench('toRecoveredBytes', () => {
    Signature.toRecoveredBytes(signature)
  })

  bench('fromRecoveredBytes', () => {
    Signature.fromRecoveredBytes(recoveredBytes)
  })
})

describe('Signature.toCompactBytes / fromCompactBytes', () => {
  bench('toCompactBytes', () => {
    Signature.toCompactBytes(signature)
  })

  bench('fromCompactBytes', () => {
    Signature.fromCompactBytes(compactBytes)
  })
})

describe('Secp256k1.sign + verify', () => {
  bench('sign', () => {
    Secp256k1.sign({ payload, privateKey })
  })

  bench('verify (publicKey)', () => {
    Secp256k1.verify({ payload, publicKey, signature })
  })
})

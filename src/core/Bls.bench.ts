import { bench, describe } from 'vp/test'
import * as Bls from './Bls.js'
import * as BlsPoint from './BlsPoint.js'
import * as Hex from './Hex.js'

const payload = Hex.fromBytes(new Uint8Array(32).fill(0xab))
const privateKey =
  '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'

function makeSignatures(count: number) {
  const signatures: BlsPoint.G2[] = []
  for (let i = 0; i < count; i++) {
    const privateKey = Bls.randomPrivateKey()
    signatures.push(Bls.sign({ payload, privateKey }))
  }
  return signatures
}

const sig10 = makeSignatures(10)
const sig100 = makeSignatures(100)
const sig1000 = makeSignatures(1000)
const sig10Bytes = sig10.map(BlsPoint.toBytes)
const sig10Hex = sig10.map(BlsPoint.toHex)

const publicKeyObject = Bls.getPublicKey({ privateKey })
const publicKeyBytes = Bls.getPublicKey({ as: 'Bytes', privateKey })
const publicKeyHex = Bls.getPublicKey({ as: 'Hex', privateKey })
const signatureObject = Bls.sign({ payload, privateKey })
const signatureBytes = Bls.sign({ as: 'Bytes', payload, privateKey })
const signatureHex = Bls.sign({ as: 'Hex', payload, privateKey })

describe('Bls.getPublicKey', () => {
  bench('Object output', () => {
    Bls.getPublicKey({ privateKey })
  })

  bench('Bytes output', () => {
    Bls.getPublicKey({ as: 'Bytes', privateKey })
  })

  bench('Hex output', () => {
    Bls.getPublicKey({ as: 'Hex', privateKey })
  })
})

describe('Bls.sign', () => {
  bench('Object output', () => {
    Bls.sign({ payload, privateKey })
  })

  bench('Bytes output', () => {
    Bls.sign({ as: 'Bytes', payload, privateKey })
  })

  bench('Hex output', () => {
    Bls.sign({ as: 'Hex', payload, privateKey })
  })
})

describe('Bls.verify', () => {
  bench('Object input', () => {
    Bls.verify({
      payload,
      publicKey: publicKeyObject,
      signature: signatureObject,
    })
  })

  bench('Bytes input', () => {
    Bls.verify({
      payload,
      publicKey: publicKeyBytes,
      signature: signatureBytes,
    })
  })

  bench('Hex input', () => {
    Bls.verify({
      payload,
      publicKey: publicKeyHex,
      signature: signatureHex,
    })
  })
})

describe('Bls.aggregate', () => {
  bench('10 serialized Bytes signatures', () => {
    Bls.aggregate(sig10Bytes, { group: 'G2' })
  })

  bench('10 serialized Hex signatures', () => {
    Bls.aggregate(sig10Hex, { group: 'G2' })
  })

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

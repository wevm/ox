import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bench, describe } from 'vp/test'
import { engine as wasmEngine } from './Secp256k1.js'

const wasm = await wasmEngine()
const privateKey = new Uint8Array(32)
privateKey[31] = 1
const privateKeyB = new Uint8Array(32)
privateKeyB[31] = 2
const payload = Uint8Array.from({ length: 32 }, (_, index) => index)
const publicKey = secp256k1.getPublicKey(privateKey, false)
const publicKeyB = secp256k1.getPublicKey(privateKeyB, false)
const signature = secp256k1.sign(payload, privateKey, {
  extraEntropy: false,
  format: 'recovered',
  lowS: true,
  prehash: false,
})
const signOptions = { extraEntropy: false, prehash: false } as const
const verifyOptions = { prehash: false } as const

describe('getPublicKey', () => {
  bench('ox', () => {
    secp256k1.getPublicKey(privateKey, false)
  })

  bench('ox/wasm', () => {
    wasm.getPublicKey(privateKey)
  })
})

describe('getSharedSecret', () => {
  bench('ox', () => {
    secp256k1.getSharedSecret(privateKey, publicKeyB, true)
  })

  bench('ox/wasm', () => {
    wasm.getSharedSecret(privateKey, publicKeyB)
  })
})

describe('recoverPublicKey', () => {
  bench('ox', () => {
    secp256k1.Signature.fromBytes(signature, 'recovered')
      .recoverPublicKey(payload)
      .toBytes(false)
  })

  bench('ox/wasm', () => {
    wasm.recoverPublicKey(signature, payload)
  })
})

describe('sign', () => {
  bench('ox', () => {
    secp256k1.sign(payload, privateKey, {
      ...signOptions,
      format: 'recovered',
      lowS: true,
    })
  })

  bench('ox/wasm', () => {
    wasm.sign(payload, privateKey, signOptions)
  })
})

describe('verify', () => {
  bench('ox', () => {
    secp256k1.verify(signature.slice(1), payload, publicKey, {
      lowS: true,
      ...verifyOptions,
    })
  })

  bench('ox/wasm', () => {
    wasm.verify(signature.slice(1), payload, publicKey, verifyOptions)
  })
})

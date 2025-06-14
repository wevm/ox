import { attest } from '@ark/attest'
import { Ed25519 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('createKeyPair', () => {
  // Default behavior (Hex)
  {
    const keyPair = Ed25519.createKeyPair()
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<`0x${string}`>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const keyPair = Ed25519.createKeyPair({ as: 'Hex' })
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<`0x${string}`>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const keyPair = Ed25519.createKeyPair({ as: 'Bytes' })
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<Uint8Array>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<Uint8Array>()
  }
})

test('getPublicKey', () => {
  // Default behavior (Hex)
  {
    const publicKey = Ed25519.getPublicKey({ privateKey: '0x1234' })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const publicKey = Ed25519.getPublicKey({ privateKey: '0x1234', as: 'Hex' })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const publicKey = Ed25519.getPublicKey({
      privateKey: '0x1234',
      as: 'Bytes',
    })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<Uint8Array>()
  }

  // Bytes input
  {
    const publicKey = Ed25519.getPublicKey({ privateKey: new Uint8Array(32) })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }
})

test('randomPrivateKey', () => {
  // Default behavior (Hex)
  {
    const privateKey = Ed25519.randomPrivateKey()
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const privateKey = Ed25519.randomPrivateKey({ as: 'Hex' })
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const privateKey = Ed25519.randomPrivateKey({ as: 'Bytes' })
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<Uint8Array>()
  }
})

test('sign', () => {
  // Default behavior (Hex)
  {
    const signature = Ed25519.sign({
      payload: '0xdeadbeef',
      privateKey: '0x1234',
    })
    attest(signature).type.toString.snap()
    expectTypeOf(signature).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const signature = Ed25519.sign({
      payload: '0xdeadbeef',
      privateKey: '0x1234',
      as: 'Hex',
    })
    attest(signature).type.toString.snap()
    expectTypeOf(signature).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const signature = Ed25519.sign({
      payload: '0xdeadbeef',
      privateKey: '0x1234',
      as: 'Bytes',
    })
    attest(signature).type.toString.snap()
    expectTypeOf(signature).toMatchTypeOf<Uint8Array>()
  }

  // Bytes inputs
  {
    const signature = Ed25519.sign({
      payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      privateKey: new Uint8Array(32),
    })
    attest(signature).type.toString.snap()
    expectTypeOf(signature).toMatchTypeOf<`0x${string}`>()
  }
})

test('verify', () => {
  const result = Ed25519.verify({
    payload: '0xdeadbeef',
    publicKey: '0x1234',
    signature: '0x5678',
  })

  attest(result).type.toString.snap()
  expectTypeOf(result).toMatchTypeOf<boolean>()

  // With Bytes inputs
  const resultWithBytes = Ed25519.verify({
    payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    publicKey: new Uint8Array(32),
    signature: new Uint8Array(64),
  })

  expectTypeOf(resultWithBytes).toMatchTypeOf<boolean>()
})

test('noble export', () => {
  expectTypeOf(Ed25519.noble).toMatchTypeOf<
    typeof import('@noble/curves/ed25519').ed25519
  >()
})

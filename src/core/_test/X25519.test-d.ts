import { attest } from '@ark/attest'
import { X25519 } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('createKeyPair', () => {
  // Default behavior (Hex)
  {
    const keyPair = X25519.createKeyPair()
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<`0x${string}`>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const keyPair = X25519.createKeyPair({ as: 'Hex' })
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<`0x${string}`>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const keyPair = X25519.createKeyPair({ as: 'Bytes' })
    attest(keyPair).type.toString.snap()
    expectTypeOf(keyPair.privateKey).toMatchTypeOf<Uint8Array>()
    expectTypeOf(keyPair.publicKey).toMatchTypeOf<Uint8Array>()
  }
})

test('getPublicKey', () => {
  // Default behavior (Hex)
  {
    const publicKey = X25519.getPublicKey({ privateKey: '0x1234' })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const publicKey = X25519.getPublicKey({ privateKey: '0x1234', as: 'Hex' })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const publicKey = X25519.getPublicKey({ privateKey: '0x1234', as: 'Bytes' })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<Uint8Array>()
  }

  // Bytes input
  {
    const publicKey = X25519.getPublicKey({ privateKey: new Uint8Array(32) })
    attest(publicKey).type.toString.snap()
    expectTypeOf(publicKey).toMatchTypeOf<`0x${string}`>()
  }
})

test('getSharedSecret', () => {
  // Default behavior (Hex)
  {
    const sharedSecret = X25519.getSharedSecret({
      privateKey: '0x1234',
      publicKey: '0x5678',
    })
    attest(sharedSecret).type.toString.snap()
    expectTypeOf(sharedSecret).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const sharedSecret = X25519.getSharedSecret({
      privateKey: '0x1234',
      publicKey: '0x5678',
      as: 'Hex',
    })
    attest(sharedSecret).type.toString.snap()
    expectTypeOf(sharedSecret).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const sharedSecret = X25519.getSharedSecret({
      privateKey: '0x1234',
      publicKey: '0x5678',
      as: 'Bytes',
    })
    attest(sharedSecret).type.toString.snap()
    expectTypeOf(sharedSecret).toMatchTypeOf<Uint8Array>()
  }

  // Bytes inputs
  {
    const sharedSecret = X25519.getSharedSecret({
      privateKey: new Uint8Array(32),
      publicKey: new Uint8Array(32),
    })
    attest(sharedSecret).type.toString.snap()
    expectTypeOf(sharedSecret).toMatchTypeOf<`0x${string}`>()
  }
})

test('randomPrivateKey', () => {
  // Default behavior (Hex)
  {
    const privateKey = X25519.randomPrivateKey()
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<`0x${string}`>()
  }

  // Explicit Hex format
  {
    const privateKey = X25519.randomPrivateKey({ as: 'Hex' })
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<`0x${string}`>()
  }

  // Bytes format
  {
    const privateKey = X25519.randomPrivateKey({ as: 'Bytes' })
    attest(privateKey).type.toString.snap()
    expectTypeOf(privateKey).toMatchTypeOf<Uint8Array>()
  }
})

test('noble export', () => {
  expectTypeOf(X25519.noble).toMatchTypeOf<
    typeof import('@noble/curves/ed25519').x25519
  >()
})

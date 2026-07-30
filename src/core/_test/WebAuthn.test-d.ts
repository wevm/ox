import {
  type Bytes,
  type Hex,
  Secp256k1,
  WebAuthn,
  type WebAuthnP256,
} from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

declare const input: Bytes.Bytes

describe('createCredential', () => {
  test('behavior: returns required PRF output when requested', () => {
    const infer = async () => {
      const credential = await WebAuthn.createCredential({
        name: 'Example',
        prf: true,
      })

      expectTypeOf(credential.prf).toEqualTypeOf<Bytes.Bytes>()
      expectTypeOf(Secp256k1.fromPrf(credential.prf)).toEqualTypeOf<Hex.Hex>()
    }
    expectTypeOf(infer).toBeFunction()
  })

  test('behavior: preserves ordinary credential return type', () => {
    const infer = async () => {
      const credential = await WebAuthn.createCredential({
        name: 'Example',
      })

      expectTypeOf(credential).toEqualTypeOf<WebAuthnP256.P256Credential>()
      // @ts-expect-error Ordinary credential creation has no PRF output.
      void credential.prf
    }
    expectTypeOf(infer).toBeFunction()
  })

  test('behavior: accepts custom input', () => {
    const infer = async () => {
      const credential = await WebAuthn.createCredential({
        name: 'Example',
        prf: {
          input,
        },
      })

      expectTypeOf(credential.prf).toEqualTypeOf<Bytes.Bytes>()
    }
    expectTypeOf(infer).toBeFunction()
  })

  test('error: managed options', () => {
    const managedExtension = () =>
      // @ts-expect-error The PRF extension is managed by createCredential.
      WebAuthn.createCredential({
        extensions: {
          prf: {
            eval: {
              first: input,
            },
          },
        },
        name: 'Example',
        prf: true,
      })

    const userVerification = () =>
      WebAuthn.createCredential({
        authenticatorSelection: {
          // @ts-expect-error User verification is always required.
          userVerification: 'preferred',
        },
        name: 'Example',
        prf: true,
      })

    const rawOptions = {
      name: 'Example',
      prf: true,
      publicKey: {},
    } as const
    const publicKey = () =>
      // @ts-expect-error Raw credential options cannot be combined with PRF.
      WebAuthn.createCredential(rawOptions)

    expectTypeOf(managedExtension).toBeFunction()
    expectTypeOf(publicKey).toBeFunction()
    expectTypeOf(userVerification).toBeFunction()
  })
})

describe('getCredential', () => {
  test('behavior: returns required PRF output', () => {
    const infer = async () => {
      const credential = await WebAuthn.getCredential({
        prf: true,
      })

      expectTypeOf(credential.prf).toEqualTypeOf<Bytes.Bytes>()
      expectTypeOf(credential.id).toEqualTypeOf<string>()
      expectTypeOf(credential.raw).toEqualTypeOf<WebAuthn.PublicKeyCredential>()
      // @ts-expect-error PRF requests do not parse the assertion signature.
      void credential.signature
    }
    expectTypeOf(infer).toBeFunction()
  })

  test('error: managed options', () => {
    const managedExtension = () =>
      WebAuthn.getCredential({
        extensions: {
          // @ts-expect-error The PRF extension is managed by getCredential.
          prf: {
            eval: {
              first: input,
            },
          },
        },
        prf: true,
      })

    const userVerification = () =>
      WebAuthn.getCredential({
        prf: true,
        // @ts-expect-error User verification is always required.
        userVerification: 'preferred',
      })

    const rawOptions = {
      prf: true,
      publicKey: {},
    } as const
    const publicKey = () =>
      // @ts-expect-error Raw credential options cannot be combined with PRF.
      WebAuthn.getCredential(rawOptions)

    expectTypeOf(managedExtension).toBeFunction()
    expectTypeOf(publicKey).toBeFunction()
    expectTypeOf(userVerification).toBeFunction()
  })
})

import { P256, Secp256k1 } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vitest'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

// Use a fixed private key for testing signatures
const testPrivateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const

describe('from', () => {
  test('default', () => {
    {
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      expectTypeOf(authorization).toEqualTypeOf<{
        readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
        readonly chainId: 1
        readonly nonce: 40n
      }>()
      expectTypeOf(authorization).toExtend<
        AuthorizationTempo.AuthorizationTempo<false>
      >()
      expect(authorization).toMatchInlineSnapshot(
        `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
      }
    `,
      )
    }

    {
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        signature: {
          signature: {
            r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
            s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
            yParity: 0,
          },
          type: 'secp256k1' as const,
        },
      })
      expectTypeOf(authorization).toEqualTypeOf<{
        readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
        readonly chainId: 1
        readonly nonce: 40n
        readonly signature: {
          readonly signature: {
            readonly r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n
            readonly s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n
            readonly yParity: 0
          }
          readonly type: 'secp256k1'
        }
      }>()
      expectTypeOf(authorization).toExtend<
        AuthorizationTempo.AuthorizationTempo<true>
      >()
      expect(authorization).toMatchInlineSnapshot(
        `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
        "signature": {
          "signature": {
            "r": 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
            "s": 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      }
    `,
      )
    }
  })

  test('options: signature (secp256k1)', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const signature = Secp256k1.sign({
      payload: AuthorizationTempo.getSignPayload(authorization),
      privateKey: testPrivateKey,
    })
    const authorization_signed = AuthorizationTempo.from(authorization, {
      signature,
    })
    expectTypeOf(authorization_signed).toExtend<{
      readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
      readonly chainId: 1
      readonly nonce: 40n
    }>()
    expectTypeOf(authorization_signed).toExtend<
      AuthorizationTempo.AuthorizationTempo<true>
    >()
    expect(authorization_signed).toMatchInlineSnapshot(
      `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
        "signature": {
          "r": 74666311849961653398815470296948700361392062371901161364182304079113687952627n,
          "s": 24912990662134805731506157958890440652926649106845286943280690489391727501383n,
          "yParity": 1,
        },
      }
    `,
    )
  })

  test('options: signature (secp256k1)', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const signature = Secp256k1.sign({
      payload: AuthorizationTempo.getSignPayload(authorization),
      privateKey: testPrivateKey,
    })
    const signatureEnvelope = SignatureEnvelope.from({
      signature,
      type: 'secp256k1',
    })
    const authorization_signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })
    expectTypeOf(authorization_signed).toExtend<{
      readonly address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
      readonly chainId: 1
      readonly nonce: 40n
    }>()
    expectTypeOf(authorization_signed).toExtend<
      AuthorizationTempo.AuthorizationTempo<true>
    >()
    expect(authorization_signed).toMatchInlineSnapshot(
      `
    {
      "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
      "chainId": 1,
      "nonce": 40n,
      "signature": {
        "signature": {
          "r": 74666311849961653398815470296948700361392062371901161364182304079113687952627n,
          "s": 24912990662134805731506157958890440652926649106845286943280690489391727501383n,
          "yParity": 1,
        },
        "type": "secp256k1",
      },
    }
  `,
    )
  })

  test('options: signature (p256)', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })

    const privateKey = P256.randomPrivateKey()
    const publicKey = P256.getPublicKey({ privateKey })
    const payload = AuthorizationTempo.getSignPayload(authorization)
    const signature = P256.sign({ payload, privateKey })

    const signatureEnvelope: SignatureEnvelope.P256 = {
      prehash: true,
      publicKey,
      signature,
      type: 'p256',
    }

    const authorization_signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })

    expectTypeOf(authorization_signed).toExtend<
      AuthorizationTempo.AuthorizationTempo<true>
    >()
    expect(authorization_signed.signature.type).toBe('p256')
    expect(authorization_signed.signature.prehash).toBe(true)
    expect(authorization_signed.signature.publicKey).toEqual(publicKey)
  })

  test('options: signature (webAuthn)', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })

    const signatureEnvelope = SignatureEnvelope.from({
      metadata: {
        authenticatorData:
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
        clientDataJSON:
          '{"type":"webauthn.get","challenge":"","origin":"https://example.com","crossOrigin":false}',
      },
      publicKey: { prefix: 4, x: 1n, y: 2n },
      signature: { r: 3n, s: 4n },
      type: 'webAuthn',
    })

    const authorization_signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })

    expectTypeOf(authorization_signed).toExtend<
      AuthorizationTempo.AuthorizationTempo<true>
    >()
    expect(authorization_signed.signature.type).toBe('webAuthn')
    expect(authorization_signed.signature.metadata).toBeDefined()
    expect(authorization_signed.signature.publicKey).toEqual(
      signatureEnvelope.publicKey,
    )
  })

  test('behavior: rpc', () => {
    {
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: '0x1',
        nonce: '0x1',
        signature: {
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: '0x0',
          type: 'secp256k1',
        },
      })
      expectTypeOf(
        authorization,
      ).toExtend<AuthorizationTempo.AuthorizationTempo>()
      expect(authorization).toMatchInlineSnapshot(
        `
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      }
    `,
      )
    }
  })
})

describe('fromRpc', () => {
  test('secp256k1', () => {
    expect(
      AuthorizationTempo.fromRpc({
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1',
        nonce: '0x1',
        signature: {
          r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
          s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
          yParity: '0x0',
          type: 'secp256k1',
        },
      }),
    ).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 1n,
      "signature": {
        "signature": {
          "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          "yParity": 0,
        },
        "type": "secp256k1",
      },
    }
  `)
  })

  test('p256', () => {
    const result = AuthorizationTempo.fromRpc({
      address: '0x0000000000000000000000000000000000000000',
      chainId: '0x1',
      nonce: '0x1',
      signature: {
        preHash: true,
        pubKeyX:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        pubKeyY:
          '0x0000000000000000000000000000000000000000000000000000000000000002',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        type: 'p256',
      },
    })
    expect(result.signature.type).toBe('p256')
    expect(result.signature).toHaveProperty('prehash', true)
    expect(result.signature).toHaveProperty('publicKey')
  })

  test('webAuthn', () => {
    const result = AuthorizationTempo.fromRpc({
      address: '0x0000000000000000000000000000000000000000',
      chainId: '0x1',
      nonce: '0x1',
      signature: {
        pubKeyX:
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        pubKeyY:
          '0x0000000000000000000000000000000000000000000000000000000000000002',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        type: 'webAuthn',
        webauthnData:
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f6578616d706c652e636f6d222c2263726f73734f726967696e223a66616c73657d',
      },
    })
    expect(result.signature.type).toBe('webAuthn')
    expect(result.signature).toHaveProperty('metadata')
    expect(result.signature).toHaveProperty('publicKey')
  })
})

describe('fromRpcList', () => {
  test('secp256k1', () => {
    expect(
      AuthorizationTempo.fromRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          signature: {
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            yParity: '0x0',
            type: 'secp256k1',
          },
        },
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          signature: {
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            yParity: '0x0',
            type: 'secp256k1',
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
    [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      },
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      },
    ]
  `)
  })

  test('p256', () => {
    expect(
      AuthorizationTempo.fromRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          signature: {
            preHash: true,
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000002',
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            type: 'p256',
          },
        },
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: '0x2',
          nonce: '0x2',
          signature: {
            preHash: false,
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000003',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000004',
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            type: 'p256',
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
    [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "prehash": true,
          "publicKey": {
            "prefix": 4,
            "x": 1n,
            "y": 2n,
          },
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          },
          "type": "p256",
        },
      },
      {
        "address": "0x0000000000000000000000000000000000000001",
        "chainId": 2,
        "nonce": 2n,
        "signature": {
          "prehash": false,
          "publicKey": {
            "prefix": 4,
            "x": 3n,
            "y": 4n,
          },
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          },
          "type": "p256",
        },
      },
    ]
  `)
  })

  test('webAuthn', () => {
    expect(
      AuthorizationTempo.fromRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          signature: {
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000002',
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            type: 'webAuthn',
            webauthnData:
              '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f6578616d706c652e636f6d222c2263726f73734f726967696e223a66616c73657d',
          },
        },
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: '0x2',
          nonce: '0x2',
          signature: {
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000003',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000004',
            r: '0x1',
            s: '0x2',
            type: 'webAuthn',
            webauthnData:
              '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f6578616d706c652e636f6d222c2263726f73734f726967696e223a66616c73657d',
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
    [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"","origin":"https://example.com","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 1n,
            "y": 2n,
          },
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
          },
          "type": "webAuthn",
        },
      },
      {
        "address": "0x0000000000000000000000000000000000000001",
        "chainId": 2,
        "nonce": 2n,
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"","origin":"https://example.com","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 3n,
            "y": 4n,
          },
          "signature": {
            "r": 1n,
            "s": 2n,
          },
          "type": "webAuthn",
        },
      },
    ]
  `)
  })

  test('mixed signature types', () => {
    expect(
      AuthorizationTempo.fromRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          nonce: '0x1',
          signature: {
            r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
            s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
            yParity: '0x0',
            type: 'secp256k1',
          },
        },
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: '0x2',
          nonce: '0x2',
          signature: {
            preHash: true,
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000003',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000004',
            r: '0x1',
            s: '0x2',
            type: 'p256',
          },
        },
        {
          address: '0x0000000000000000000000000000000000000002',
          chainId: '0x3',
          nonce: '0x3',
          signature: {
            pubKeyX:
              '0x0000000000000000000000000000000000000000000000000000000000000005',
            pubKeyY:
              '0x0000000000000000000000000000000000000000000000000000000000000006',
            r: '0x3',
            s: '0x4',
            type: 'webAuthn',
            webauthnData:
              '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f6578616d706c652e636f6d222c2263726f73734f726967696e223a66616c73657d',
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
    [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 1,
        "nonce": 1n,
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      },
      {
        "address": "0x0000000000000000000000000000000000000001",
        "chainId": 2,
        "nonce": 2n,
        "signature": {
          "prehash": true,
          "publicKey": {
            "prefix": 4,
            "x": 3n,
            "y": 4n,
          },
          "signature": {
            "r": 1n,
            "s": 2n,
          },
          "type": "p256",
        },
      },
      {
        "address": "0x0000000000000000000000000000000000000002",
        "chainId": 3,
        "nonce": 3n,
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"","origin":"https://example.com","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 5n,
            "y": 6n,
          },
          "signature": {
            "r": 3n,
            "s": 4n,
          },
          "type": "webAuthn",
        },
      },
    ]
  `)
  })
})

describe('fromTuple', () => {
  test('default', () => {
    const tuple = [
      '0x1',
      '0x0000000000000000000000000000000000000000',
      '0x3',
    ] as const satisfies AuthorizationTempo.Tuple
    const authorization = AuthorizationTempo.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 3n,
    }
  `)
  })

  test('behavior: zeroish nonce + chainId', () => {
    const tuple = [
      '0x',
      '0x0000000000000000000000000000000000000000',
      '0x',
    ] as const satisfies AuthorizationTempo.Tuple
    const authorization = AuthorizationTempo.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": 0,
        "nonce": 0n,
      }
    `)
  })

  test('behavior: signature (secp256k1)', () => {
    const signatureEnvelope = SignatureEnvelope.from({
      signature: { r: 1n, s: 2n, yParity: 0 },
      type: 'secp256k1',
    })
    const serialized = SignatureEnvelope.serialize(signatureEnvelope)

    const tuple = [
      '0x1',
      '0x0000000000000000000000000000000000000000',
      '0x3',
      serialized,
    ] as const satisfies AuthorizationTempo.Tuple
    const authorization = AuthorizationTempo.fromTuple(tuple)
    expect(authorization).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 3n,
      "signature": {
        "signature": {
          "r": 1n,
          "s": 2n,
          "yParity": 0,
        },
        "type": "secp256k1",
      },
    }
  `)
  })

  test('behavior: signature (p256)', () => {
    const signatureEnvelope = SignatureEnvelope.from({
      prehash: true,
      publicKey: { prefix: 4, x: 1n, y: 2n },
      signature: { r: 3n, s: 4n },
      type: 'p256',
    })
    const serialized = SignatureEnvelope.serialize(signatureEnvelope)

    const tuple = [
      '0x1',
      '0x0000000000000000000000000000000000000000',
      '0x3',
      serialized,
    ] as const satisfies AuthorizationTempo.Tuple
    const authorization = AuthorizationTempo.fromTuple(tuple)
    expect(authorization.signature?.type).toBe('p256')
  })
})

describe('fromTupleList', () => {
  test('default', () => {
    const tupleList = [
      ['0x01', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x28'],
      ['0x03', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14'],
    ] as const satisfies AuthorizationTempo.TupleList
    const authorization = AuthorizationTempo.fromTupleList(tupleList)
    expect(authorization).toMatchInlineSnapshot(`
    [
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 1,
        "nonce": 40n,
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 3,
        "nonce": 20n,
      },
    ]
  `)
  })

  test('behavior: signature', () => {
    const signatureEnvelope1 = SignatureEnvelope.from({
      signature: { r: 1n, s: 2n, yParity: 0 },
      type: 'secp256k1',
    })
    const signatureEnvelope2 = SignatureEnvelope.from({
      signature: { r: 4n, s: 5n, yParity: 0 },
      type: 'secp256k1',
    })

    const authorization = AuthorizationTempo.fromTupleList([
      [
        '0x05',
        '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        '0x2a',
        SignatureEnvelope.serialize(signatureEnvelope1),
      ],
      [
        '0x02',
        '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        '0x2b',
        SignatureEnvelope.serialize(signatureEnvelope2),
      ],
    ])
    expect(authorization).toMatchInlineSnapshot(`
    [
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 5,
        "nonce": 42n,
        "signature": {
          "signature": {
            "r": 1n,
            "s": 2n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      },
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 2,
        "nonce": 43n,
        "signature": {
          "signature": {
            "r": 4n,
            "s": 5n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
      },
    ]
  `)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    expect(
      AuthorizationTempo.getSignPayload({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      }),
    ).toMatchInlineSnapshot(
      `"0x5919da563810a99caf657d42bd10905adbd28b3b89b8a4577efa471e5e4b3914"`,
    )

    expect(
      AuthorizationTempo.getSignPayload({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 69,
        nonce: 420n,
      }),
    ).toMatchInlineSnapshot(
      `"0x7bdd120f6437316be99b11232d472bb0209d20d7c564f4dfbad855189e830b15"`,
    )
  })
})

describe('hash', () => {
  test('default', () => {
    expect(
      AuthorizationTempo.hash({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      }),
    ).toMatchInlineSnapshot(
      `"0x5919da563810a99caf657d42bd10905adbd28b3b89b8a4577efa471e5e4b3914"`,
    )

    expect(
      AuthorizationTempo.hash({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 69,
        nonce: 420n,
      }),
    ).toMatchInlineSnapshot(
      `"0x7bdd120f6437316be99b11232d472bb0209d20d7c564f4dfbad855189e830b15"`,
    )
  })

  test('options: presign equals getSignPayload', () => {
    const authorization = {
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    } as const
    const payload = AuthorizationTempo.getSignPayload(authorization)
    const hash_presign = AuthorizationTempo.hash(authorization, {
      presign: true,
    })
    expect(hash_presign).toEqual(payload)
  })
})

describe('toRpc', () => {
  test('secp256k1', () => {
    expect(
      AuthorizationTempo.toRpc({
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        nonce: 1n,
        signature: {
          signature: {
            r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            yParity: 0,
          },
          type: 'secp256k1',
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "chainId": "0x1",
        "nonce": "0x1",
        "signature": {
          "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
          "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
          "type": "secp256k1",
          "yParity": "0x0",
        },
      }
    `)
  })

  test('p256', () => {
    const result = AuthorizationTempo.toRpc({
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      nonce: 1n,
      signature: {
        prehash: true,
        publicKey: { prefix: 4, x: 1n, y: 2n },
        signature: {
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        },
        type: 'p256',
      },
    })
    expect(result.signature.type).toBe('p256')
  })

  test('webAuthn', () => {
    const result = AuthorizationTempo.toRpc({
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      nonce: 1n,
      signature: {
        metadata: {
          authenticatorData: '0x1234',
          clientDataJSON: '0x5678',
        },
        publicKey: { prefix: 4, x: 1n, y: 2n },
        signature: {
          r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
          s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        },
        type: 'webAuthn',
      },
    })
    expect(result.signature.type).toBe('webAuthn')
  })
})

describe('toRpcList', () => {
  test('default', () => {
    expect(
      AuthorizationTempo.toRpcList([
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          nonce: 1n,
          signature: {
            signature: {
              r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
              s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
              yParity: 0,
            },
            type: 'secp256k1',
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "address": "0x0000000000000000000000000000000000000000",
          "chainId": "0x1",
          "nonce": "0x1",
          "signature": {
            "r": "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
            "s": "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
            "type": "secp256k1",
            "yParity": "0x0",
          },
        },
      ]
    `)
  })
})

describe('toTuple', () => {
  test('default', () => {
    {
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      const tuple = AuthorizationTempo.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
        [
          "0x1",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x28",
        ]
      `)
    }

    {
      const signatureEnvelope: SignatureEnvelope.Secp256k1 = {
        signature: { r: 1n, s: 2n, yParity: 0 },
        type: 'secp256k1',
      }
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        signature: signatureEnvelope,
      })
      const tuple = AuthorizationTempo.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
        [
          "0x1",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x28",
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
        ]
      `)
    }

    {
      const authorization = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 0,
        nonce: 0n,
      })
      const tuple = AuthorizationTempo.toTuple(authorization)
      expect(tuple).toMatchInlineSnapshot(`
      [
        "0x",
        "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "0x",
      ]
    `)
    }
  })
})

describe('toTupleList', () => {
  test('default', () => {
    {
      const tuple = AuthorizationTempo.toTupleList([])
      expect(tuple).toMatchInlineSnapshot('[]')
    }

    {
      const authorization_1 = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
      })
      const authorization_2 = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 3,
        nonce: 20n,
      })
      const tuple = AuthorizationTempo.toTupleList([
        authorization_1,
        authorization_2,
      ])
      expect(tuple).toMatchInlineSnapshot(`
        [
          [
            "0x1",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x28",
          ],
          [
            "0x3",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x14",
          ],
        ]
      `)
    }

    {
      const signatureEnvelope1 = SignatureEnvelope.from({
        signature: { r: 1n, s: 2n, yParity: 0 },
        type: 'secp256k1',
      })
      const signatureEnvelope2 = SignatureEnvelope.from({
        signature: { r: 4n, s: 5n, yParity: 0 },
        type: 'secp256k1',
      })
      const authorization_3 = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 5,
        nonce: 42n,
        signature: signatureEnvelope1,
      })
      const authorization_4 = AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 2,
        nonce: 43n,
        signature: signatureEnvelope2,
      })
      const tuple = AuthorizationTempo.toTupleList([
        authorization_3,
        authorization_4,
      ])
      expect(tuple).toMatchInlineSnapshot(`
        [
          [
            "0x5",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x2a",
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          ],
          [
            "0x2",
            "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
            "0x2b",
            "0x000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000051b",
          ],
        ]
      `)
    }
  })

  test('behavior: undefined input returns empty', () => {
    const tuple = AuthorizationTempo.toTupleList()
    expect(tuple).toMatchInlineSnapshot('[]')
  })
})

describe('signature type interoperability', () => {
  test('secp256k1 signature round trip', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })

    const signature = Secp256k1.sign({
      payload: AuthorizationTempo.getSignPayload(authorization),
      privateKey: testPrivateKey,
    })
    const signatureEnvelope = SignatureEnvelope.from({
      signature,
      type: 'secp256k1',
    })

    const signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })
    const rpc = AuthorizationTempo.toRpc(signed)
    const restored = AuthorizationTempo.fromRpc(rpc)

    expect(restored).toEqual(signed)
  })

  test('p256 signature round trip', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })

    const privateKey = P256.randomPrivateKey()
    const publicKey = P256.getPublicKey({ privateKey })
    const payload = AuthorizationTempo.getSignPayload(authorization)
    const signature = P256.sign({ payload, privateKey })

    const signatureEnvelope = SignatureEnvelope.from({
      prehash: true,
      publicKey,
      signature,
      type: 'p256',
    })

    const signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })
    const rpc = AuthorizationTempo.toRpc(signed)
    const restored = AuthorizationTempo.fromRpc(rpc)

    expect(restored.signature.type).toBe('p256')
    expect(restored.address).toEqual(signed.address)
    expect(restored.chainId).toEqual(signed.chainId)
    expect(restored.nonce).toEqual(signed.nonce)
    expect(restored.signature.type).toEqual(signed.signature.type)
    expect(restored.signature.prehash).toEqual(signed.signature.prehash)
    expect(restored.signature.publicKey).toEqual(signed.signature.publicKey)
    expect(restored.signature.signature?.r).toEqual(
      signed.signature.signature?.r,
    )
    expect(restored.signature.signature?.s).toEqual(
      signed.signature.signature?.s,
    )
  })

  test('webAuthn signature round trip', () => {
    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })

    const signatureEnvelope = SignatureEnvelope.from({
      metadata: {
        authenticatorData:
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
        clientDataJSON:
          '{"type":"webauthn.get","challenge":"","origin":"https://example.com","crossOrigin":false}',
      },
      publicKey: { prefix: 4, x: 1n, y: 2n },
      signature: {
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
      },
      type: 'webAuthn',
    })

    const signed = AuthorizationTempo.from(authorization, {
      signature: signatureEnvelope,
    })
    const rpc = AuthorizationTempo.toRpc(signed)
    const restored = AuthorizationTempo.fromRpc(rpc)

    expect(restored.signature.type).toBe('webAuthn')
    expect(restored.address).toEqual(signed.address)
    expect(restored.chainId).toEqual(signed.chainId)
    expect(restored.nonce).toEqual(signed.nonce)
    expect(restored.signature.type).toEqual(signed.signature.type)
    expect(restored.signature.metadata).toEqual(signed.signature.metadata)
    expect(restored.signature.publicKey).toEqual(signed.signature.publicKey)
    expect(restored.signature.signature?.r).toEqual(
      signed.signature.signature?.r,
    )
    expect(restored.signature.signature?.s).toEqual(
      signed.signature.signature?.s,
    )
  })

  test('tuple serialization preserves signature type', () => {
    const signatureEnvelope = SignatureEnvelope.from({
      prehash: true,
      publicKey: { prefix: 4, x: 1n, y: 2n },
      signature: { r: 3n, s: 4n },
      type: 'p256',
    })

    const authorization = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
      signature: signatureEnvelope,
    })

    const tuple = AuthorizationTempo.toTuple(authorization)
    const restored = AuthorizationTempo.fromTuple(tuple)

    expect(restored.signature?.type).toBe('p256')
  })
})

test('exports', () => {
  expect(Object.keys(AuthorizationTempo)).toMatchInlineSnapshot(`
    [
      "from",
      "fromRpc",
      "fromRpcList",
      "fromTuple",
      "fromTupleList",
      "getSignPayload",
      "hash",
      "toRpc",
      "toRpcList",
      "toTuple",
      "toTupleList",
    ]
  `)
})

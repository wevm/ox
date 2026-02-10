import {
  Hex,
  PublicKey,
  Rlp,
  Secp256k1,
  Signature,
  Value,
  WebAuthnP256,
} from 'ox'
import { describe, expect, test } from 'vitest'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const address = '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c'
const expiry = 1234567890
const token = '0x20c0000000000000000000000000000000000001'

const privateKey_secp256k1 =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const signature_secp256k1 = Secp256k1.sign({
  payload: '0xdeadbeef',
  privateKey: privateKey_secp256k1,
})

const publicKey_p256 = PublicKey.from({
  prefix: 4,
  x: 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
  y: 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
})

const signature_p256_raw = Signature.from({
  r: 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
  s: 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
  yParity: 0,
})

const signature_p256 = SignatureEnvelope.from({
  signature: signature_p256_raw,
  publicKey: publicKey_p256,
  prehash: true,
})

const signature_webauthn = SignatureEnvelope.from({
  signature: signature_p256_raw,
  publicKey: publicKey_p256,
  metadata: {
    authenticatorData: WebAuthnP256.getAuthenticatorData({ rpId: 'localhost' }),
    clientDataJSON: WebAuthnP256.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'http://localhost',
    }),
  },
})

describe('from', () => {
  test('default', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })

  test('with signature (secp256k1)', () => {
    const authorization = KeyAuthorization.from(
      {
        address,
        expiry,
        type: 'secp256k1',
        limits: [
          {
            token,
            limit: Value.from('10', 6),
          },
        ],
      },
      {
        signature: signature_secp256k1,
      },
    )

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 113291597329930009559670063131885256927775966057121513567941051428123344285399n,
            "s": 54293712598725100598138577281441749550405991478212695085505730636505228583888n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('with signature (secp256k1)', () => {
    const authorization = KeyAuthorization.from(
      {
        address,
        expiry,
        type: 'secp256k1',
        limits: [
          {
            token,
            limit: Value.from('10', 6),
          },
        ],
      },
      {
        signature: SignatureEnvelope.from(signature_secp256k1),
      },
    )

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 113291597329930009559670063131885256927775966057121513567941051428123344285399n,
            "s": 54293712598725100598138577281441749550405991478212695085505730636505228583888n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('with signature (p256)', () => {
    const authorization = KeyAuthorization.from(
      {
        address,
        expiry,
        type: 'p256',
        limits: [
          {
            token,
            limit: Value.from('10', 6),
          },
        ],
      },
      {
        signature: signature_p256,
      },
    )

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "prehash": true,
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
            "yParity": 0,
          },
          "type": "p256",
        },
        "type": "p256",
      }
    `)
  })

  test('with signature (webAuthn)', () => {
    const authorization = KeyAuthorization.from(
      {
        address,
        expiry,
        type: 'webAuthn',
        limits: [
          {
            token,
            limit: Value.from('10', 6),
          },
        ],
      },
      {
        signature: signature_webauthn,
      },
    )

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"3q2-7w","origin":"http://localhost","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
            "yParity": 0,
          },
          "type": "webAuthn",
        },
        "type": "webAuthn",
      }
    `)
  })

  test('with inline signature (secp256k1)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 113291597329930009559670063131885256927775966057121513567941051428123344285399n,
            "s": 54293712598725100598138577281441749550405991478212695085505730636505228583888n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('from rpc', () => {
    const authorization = KeyAuthorization.from({
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'secp256k1',
      limits: [{ token, limit: '0x989680' }],
      signature: {
        type: 'secp256k1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      },
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('multiple limits', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
        {
          token: '0x20c0000000000000000000000000000000000002',
          limit: Value.from('20', 6),
        },
      ],
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
          {
            "limit": 20000000n,
            "token": "0x20c0000000000000000000000000000000000002",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })

  test('zero expiry (never expires)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry: 0,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "expiry": 0,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })
})

describe('fromRpc', () => {
  test('secp256k1', () => {
    const authorization = KeyAuthorization.fromRpc({
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'secp256k1',
      limits: [{ token, limit: '0x989680' }],
      signature: {
        type: 'secp256k1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      },
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('p256', () => {
    const authorization = KeyAuthorization.fromRpc({
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'p256',
      limits: [{ token, limit: '0x989680' }],
      signature: {
        type: 'p256',
        preHash: true,
        pubKeyX: Hex.fromNumber(publicKey_p256.x),
        pubKeyY: Hex.fromNumber(publicKey_p256.y),
        r: Hex.fromNumber(signature_p256_raw.r),
        s: Hex.fromNumber(signature_p256_raw.s),
      },
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "prehash": true,
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
          },
          "type": "p256",
        },
        "type": "p256",
      }
    `)
  })

  test('webAuthn', () => {
    const authorization = KeyAuthorization.fromRpc({
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'webAuthn',
      limits: [{ token, limit: '0x989680' }],
      signature: SignatureEnvelope.toRpc(signature_webauthn),
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"3q2-7w","origin":"http://localhost","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
          },
          "type": "webAuthn",
        },
        "type": "webAuthn",
      }
    `)
  })

  test('multiple limits', () => {
    const authorization = KeyAuthorization.fromRpc({
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: '0x989680',
        },
        {
          token: '0x20c0000000000000000000000000000000000002',
          limit: '0x1312d00',
        },
      ],
      signature: {
        type: 'secp256k1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      },
    })

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
          {
            "limit": 20000000n,
            "token": "0x20c0000000000000000000000000000000000002",
          },
        ],
        "signature": {
          "signature": {
            "r": 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
            "s": 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('handles chainId "0x" as 0n', () => {
    const authorization = KeyAuthorization.fromRpc({
      chainId: '0x',
      expiry: Hex.fromNumber(expiry),
      keyId: address,
      keyType: 'secp256k1',
      limits: [{ token, limit: '0x989680' }],
      signature: {
        type: 'secp256k1',
        r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
        s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
        yParity: '0x0',
      },
    })

    expect(authorization.chainId).toBe(0n)
  })
})

describe('fromTuple', () => {
  test('default', () => {
    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x00', // keyType (secp256k1)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })

  test('with signature (secp256k1)', () => {
    const signature = SignatureEnvelope.serialize(
      SignatureEnvelope.from(signature_secp256k1),
    )

    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x00', // keyType (secp256k1)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
      signature,
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "signature": {
            "r": 113291597329930009559670063131885256927775966057121513567941051428123344285399n,
            "s": 54293712598725100598138577281441749550405991478212695085505730636505228583888n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "type": "secp256k1",
      }
    `)
  })

  test('with signature (p256)', () => {
    const signature = SignatureEnvelope.serialize(signature_p256)

    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x01', // keyType (p256)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
      signature,
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "prehash": true,
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
          },
          "type": "p256",
        },
        "type": "p256",
      }
    `)
  })

  test('with signature (webAuthn)', () => {
    const signature = SignatureEnvelope.serialize(signature_webauthn)

    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x02', // keyType (webAuthn)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
      signature,
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"3q2-7w","origin":"http://localhost","crossOrigin":false}",
          },
          "publicKey": {
            "prefix": 4,
            "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
            "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
          },
          "signature": {
            "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
            "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
          },
          "type": "webAuthn",
        },
        "type": "webAuthn",
      }
    `)
  })

  test('multiple limits', () => {
    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x00', // keyType (secp256k1)
        address,
        Hex.fromNumber(expiry),
        [
          ['0x20c0000000000000000000000000000000000001', '0x989680'],
          ['0x20c0000000000000000000000000000000000002', '0x1312d00'],
        ],
      ],
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
          {
            "limit": 20000000n,
            "token": "0x20c0000000000000000000000000000000000002",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })

  test('with non-zero chainId', () => {
    const authorization = KeyAuthorization.fromTuple([
      [
        Hex.fromNumber(123), // chainId
        '0x00', // keyType (secp256k1)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 123n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })

  test('empty keyType treated as secp256k1', () => {
    const authorization = KeyAuthorization.fromTuple([
      [
        '0x00', // chainId
        '0x', // keyType (empty = secp256k1)
        address,
        Hex.fromNumber(expiry),
        [[token, '0x989680']],
      ],
    ])

    expect(authorization).toMatchInlineSnapshot(`
      {
        "address": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "chainId": 0n,
        "expiry": 1234567890,
        "limits": [
          {
            "limit": 10000000n,
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "type": "secp256k1",
      }
    `)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    const payload = KeyAuthorization.getSignPayload(authorization)

    expect(payload).toMatchInlineSnapshot(
      `"0x6d56b62bb5e94ca0206340e4bc1ece5a35e7ad31c30c6b98074d146d5c5de993"`,
    )
  })

  test('with signature (signature should be ignored)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    const payload = KeyAuthorization.getSignPayload(authorization)

    // Should be same as without signature
    expect(payload).toMatchInlineSnapshot(
      `"0x6d56b62bb5e94ca0206340e4bc1ece5a35e7ad31c30c6b98074d146d5c5de993"`,
    )
  })

  test('different key types', () => {
    const auth_secp256k1 = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [{ token, limit: Value.from('10', 6) }],
    })

    const auth_p256 = KeyAuthorization.from({
      address,
      expiry,
      type: 'p256',
      limits: [{ token, limit: Value.from('10', 6) }],
    })

    const auth_webauthn = KeyAuthorization.from({
      address,
      expiry,
      type: 'webAuthn',
      limits: [{ token, limit: Value.from('10', 6) }],
    })

    const payload_secp256k1 = KeyAuthorization.getSignPayload(auth_secp256k1)
    const payload_p256 = KeyAuthorization.getSignPayload(auth_p256)
    const payload_webauthn = KeyAuthorization.getSignPayload(auth_webauthn)

    // Payloads should be different for different key types
    expect(payload_secp256k1).not.toBe(payload_p256)
    expect(payload_secp256k1).not.toBe(payload_webauthn)
    expect(payload_p256).not.toBe(payload_webauthn)

    expect(payload_secp256k1).toMatchInlineSnapshot(
      `"0x6d56b62bb5e94ca0206340e4bc1ece5a35e7ad31c30c6b98074d146d5c5de993"`,
    )
    expect(payload_p256).toMatchInlineSnapshot(
      `"0x70f1d02570bd5ec14701306f7c3fadf405911fcd585136d1d60f2e4eb689f602"`,
    )
    expect(payload_webauthn).toMatchInlineSnapshot(
      `"0xb69543e8899a3d0a0186e347df6589f47ea194b6bc3ac935225411b1ef2d4627"`,
    )
  })
})

describe('hash', () => {
  test('default', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    const hash = KeyAuthorization.hash(authorization)

    expect(hash).toMatchInlineSnapshot(
      `"0x6d56b62bb5e94ca0206340e4bc1ece5a35e7ad31c30c6b98074d146d5c5de993"`,
    )
  })
})

describe('toRpc', () => {
  test('secp256k1', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from({
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        yParity: 0,
      }),
    })

    const rpc = KeyAuthorization.toRpc(authorization)

    expect(rpc).toMatchInlineSnapshot(`
      {
        "chainId": "0x",
        "expiry": "0x499602d2",
        "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "keyType": "secp256k1",
        "limits": [
          {
            "limit": "0x989680",
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
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
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'p256',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: signature_p256,
    })

    const rpc = KeyAuthorization.toRpc(authorization)

    expect(rpc).toMatchInlineSnapshot(`
      {
        "chainId": "0x",
        "expiry": "0x499602d2",
        "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "keyType": "p256",
        "limits": [
          {
            "limit": "0x989680",
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "preHash": true,
          "pubKeyX": "0xad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f5",
          "pubKeyY": "0x11edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0",
          "r": "0xccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e",
          "s": "0x77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35",
          "type": "p256",
        },
      }
    `)
  })

  test('webAuthn', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'webAuthn',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: signature_webauthn,
    })

    const rpc = KeyAuthorization.toRpc(authorization)

    expect(rpc).toMatchInlineSnapshot(`
      {
        "chainId": "0x",
        "expiry": "0x499602d2",
        "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "keyType": "webAuthn",
        "limits": [
          {
            "limit": "0x989680",
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "pubKeyX": "0xad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f5",
          "pubKeyY": "0x11edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0",
          "r": "0xccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e",
          "s": "0x77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35",
          "type": "webAuthn",
          "webauthnData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a223371322d3777222c226f726967696e223a22687474703a2f2f6c6f63616c686f7374222c2263726f73734f726967696e223a66616c73657d",
        },
      }
    `)
  })

  test('multiple limits', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
        {
          token: '0x20c0000000000000000000000000000000000002',
          limit: Value.from('20', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    const rpc = KeyAuthorization.toRpc(authorization)

    expect(rpc).toMatchInlineSnapshot(`
      {
        "chainId": "0x",
        "expiry": "0x499602d2",
        "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "keyType": "secp256k1",
        "limits": [
          {
            "limit": "0x989680",
            "token": "0x20c0000000000000000000000000000000000001",
          },
          {
            "limit": "0x1312d00",
            "token": "0x20c0000000000000000000000000000000000002",
          },
        ],
        "signature": {
          "r": "0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7",
          "s": "0x780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d0",
          "type": "secp256k1",
          "yParity": "0x1",
        },
      }
    `)
  })

  test('with non-zero chainId', () => {
    const authorization = KeyAuthorization.from({
      address,
      chainId: 123n,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    const rpc = KeyAuthorization.toRpc(authorization)

    expect(rpc).toMatchInlineSnapshot(`
      {
        "chainId": "0x7b",
        "expiry": "0x499602d2",
        "keyId": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        "keyType": "secp256k1",
        "limits": [
          {
            "limit": "0x989680",
            "token": "0x20c0000000000000000000000000000000000001",
          },
        ],
        "signature": {
          "r": "0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7",
          "s": "0x780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d0",
          "type": "secp256k1",
          "yParity": "0x1",
        },
      }
    `)
  })

  test('round-trip: toRpc -> fromRpc', () => {
    const authorization = KeyAuthorization.from({
      address,
      chainId: 0n,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    const rpc = KeyAuthorization.toRpc(authorization)
    const restored = KeyAuthorization.fromRpc(rpc)

    expect(restored).toEqual(authorization)
  })
})

describe('toTuple', () => {
  test('default', () => {
    const authorization = KeyAuthorization.from({
      address,
      type: 'secp256k1',
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
        ],
      ]
    `)
  })

  test('with signature (secp256k1)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from(signature_secp256k1),
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
          ],
        ],
        "0xfa78c5905fb0b9d6066ef531f962a62bc6ef0d5eb59ecb134056d206f75aaed7780926ff2601a935c2c79707d9e1799948c9f19dcdde1e090e903b19a07923d01c",
      ]
    `)
  })

  test('with signature (p256)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'p256',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: signature_p256,
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x01",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
          ],
        ],
        "0x01ccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35ad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f511edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba001",
      ]
    `)
  })

  test('with signature (webAuthn)', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'webAuthn',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
      signature: signature_webauthn,
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x02",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
          ],
        ],
        "0x0249960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a223371322d3777222c226f726967696e223a22687474703a2f2f6c6f63616c686f7374222c2263726f73734f726967696e223a66616c73657dccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35ad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f511edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0",
      ]
    `)
  })

  test('multiple limits', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
        {
          token: '0x20c0000000000000000000000000000000000002',
          limit: Value.from('20', 6),
        },
      ],
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
            [
              "0x20c0000000000000000000000000000000000002",
              "0x1312d00",
            ],
          ],
        ],
      ]
    `)
  })

  test('with non-zero chainId', () => {
    const authorization = KeyAuthorization.from({
      address,
      chainId: 123n,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x7b",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
          ],
        ],
      ]
    `)
  })

  test('zero spending limit roundtrips through RLP', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: 0n,
        },
      ],
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x499602d2",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x",
            ],
          ],
        ],
      ]
    `)

    const [authorizationTuple] = tuple
    const rlpEncoded = Rlp.fromHex(authorizationTuple)
    const rlpDecoded = Rlp.toHex(rlpEncoded)
    expect(rlpDecoded).toEqual(authorizationTuple)

    const restored = KeyAuthorization.fromTuple(tuple)
    expect(restored.limits?.[0]?.limit).toBe(0n)
  })

  test('zero expiry roundtrips through RLP', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry: 0,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: Value.from('10', 6),
        },
      ],
    })

    const tuple = KeyAuthorization.toTuple(authorization)

    expect(tuple).toMatchInlineSnapshot(`
      [
        [
          "0x",
          "0x",
          "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "0x",
          [
            [
              "0x20c0000000000000000000000000000000000001",
              "0x989680",
            ],
          ],
        ],
      ]
    `)

    const [authorizationTuple] = tuple
    const rlpEncoded = Rlp.fromHex(authorizationTuple)
    const rlpDecoded = Rlp.toHex(rlpEncoded)
    expect(rlpDecoded).toEqual(authorizationTuple)

    const restored = KeyAuthorization.fromTuple(tuple)
    expect(restored.expiry).toBe(0)
  })

  test('hash works with zero spending limit', () => {
    const authorization = KeyAuthorization.from({
      address,
      expiry,
      type: 'secp256k1',
      limits: [
        {
          token,
          limit: 0n,
        },
      ],
    })

    expect(() => KeyAuthorization.hash(authorization)).not.toThrow()
  })
})

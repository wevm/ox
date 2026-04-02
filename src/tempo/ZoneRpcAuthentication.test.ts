import { PublicKey, RpcTransport, Secp256k1, Signature, WebAuthnP256 } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vitest'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as ZoneRpcAuthentication from './ZoneRpcAuthentication.js'

const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const

const publicKey = PublicKey.from({
  prefix: 4,
  x: 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
  y: 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
})

const p256Signature = Signature.from({
  r: 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
  s: 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
  yParity: 0,
})

const authentication = {
  chainId: 4217000006,
  expiresAt: 1711235160,
  issuedAt: 1711234560,
  zoneId: 6,
  zonePortal: '0x7069DeC4E64Fd07334A0933eDe836C17259c9B23',
} as const

describe('from', () => {
  test('default', () => {
    const token = ZoneRpcAuthentication.from(authentication)

    expectTypeOf(token).toExtend<{
      readonly chainId: 4217000026
      readonly expiresAt: 1711235160
      readonly issuedAt: 1711234560
      readonly version: 0
      readonly zoneId: 26
      zonePortal: `0x${string}`
    }>()
    expectTypeOf(token).toExtend<
      ZoneRpcAuthentication.ZoneRpcAuthentication<false>
    >()

    expect(token).toMatchInlineSnapshot(`
      {
        "chainId": 4217000006,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "version": 0,
        "zoneId": 6,
        "zonePortal": "0x7069DeC4E64Fd07334A0933eDe836C17259c9B23",
      }
    `)
  })

  test('options: signature', () => {
    const token = ZoneRpcAuthentication.from(authentication)
    const signature = Secp256k1.sign({
      payload: ZoneRpcAuthentication.getSignPayload(token),
      privateKey,
    })

    const token_signed = ZoneRpcAuthentication.from(token, { signature })

    expectTypeOf(token_signed).toExtend<
      ZoneRpcAuthentication.ZoneRpcAuthentication<true>
    >()
    expect(token_signed).toMatchInlineSnapshot(`
      {
        "chainId": 4217000006,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "signature": {
            "r": 40351686734431274270700452833251506460179550093528042520483563401805519703376n,
            "s": 786627345783392172375258838634520174472337637961517353324978261757543563647n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "version": 0,
        "zoneId": 6,
        "zonePortal": "0x7069DeC4E64Fd07334A0933eDe836C17259c9B23",
      }
    `)
  })
})

describe('getFields', () => {
  test('default', () => {
    const token = ZoneRpcAuthentication.from(authentication)

    expect(ZoneRpcAuthentication.getFields(token)).toMatchInlineSnapshot(
      `"0x000000000600000000fb5a50467069DeC4E64Fd07334A0933eDe836C17259c9B230000000065ff5e000000000065ff6058"`,
    )
    expect(ZoneRpcAuthentication.getSignPayload(token)).toMatchInlineSnapshot(
      `"0xa433f4548ae4cb7c50f60e0dc266c57ca461ddd0061a209623e0827fc4b7bfe5"`,
    )
    expect(
      ZoneRpcAuthentication.getSignPayload(token, {
        userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      }),
    ).toMatchInlineSnapshot(
      `"0xd2d1117bf662a04bb63106cacf7974de59384ab4053a30ef3fed3fe05475c2f8"`,
    )
  })
})

describe('serialize', () => {
  test('roundtrip', () => {
    const token = ZoneRpcAuthentication.from(authentication)
    const signature = Secp256k1.sign({
      payload: ZoneRpcAuthentication.getSignPayload(token),
      privateKey,
    })

    const serialized = ZoneRpcAuthentication.serialize(token, {
      signature,
    })

    expect(serialized).toMatchInlineSnapshot(
      `"0x59363ece42781a3599c63295c190f349ad42ca8b0b5d5b9211059a36347ccd5001bd371de48dacdd1b7e27bf1eb94065782eb6b383f550b04de0de2ecdebc17f1c000000000600000000fb5a50467069DeC4E64Fd07334A0933eDe836C17259c9B230000000065ff5e000000000065ff6058"`,
    )
    expect(
      ZoneRpcAuthentication.deserialize(serialized),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 4217000006,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "signature": {
            "r": 40351686734431274270700452833251506460179550093528042520483563401805519703376n,
            "s": 786627345783392172375258838634520174472337637961517353324978261757543563647n,
            "yParity": 1,
          },
          "type": "secp256k1",
        },
        "version": 0,
        "zoneId": 6,
        "zonePortal": "0x7069DeC4E64Fd07334A0933eDe836C17259c9B23",
      }
    `)
  })

  test('parses variable-length keychain signatures from the end', () => {
    const token = ZoneRpcAuthentication.from(authentication)
    const inner = SignatureEnvelope.from(
      Secp256k1.sign({
        payload: ZoneRpcAuthentication.getSignPayload(token, {
          userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        }),
        privateKey,
      }),
    )

    const serialized = ZoneRpcAuthentication.serialize(token, {
      signature: SignatureEnvelope.from({
        inner,
        type: 'keychain',
        userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        version: 'v2',
      }),
    })

    expect(
      ZoneRpcAuthentication.deserialize(serialized),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 4217000006,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "inner": {
            "signature": {
              "r": 112321973626197669432476215906763305093610636258878019755402728069462339908152n,
              "s": 49209546339975998582588635962324430460594498604120786514504236238336822631981n,
              "yParity": 0,
            },
            "type": "secp256k1",
          },
          "type": "keychain",
          "userAddress": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "version": "v2",
        },
        "version": 0,
        "zoneId": 6,
        "zonePortal": "0x7069DeC4E64Fd07334A0933eDe836C17259c9B23",
      }
    `)
  })

  test('parses variable-length webAuthn signatures from the end', () => {
    const token = ZoneRpcAuthentication.from(authentication)
    const signature = SignatureEnvelope.from({
      signature: p256Signature,
      publicKey,
      metadata: {
        authenticatorData: WebAuthnP256.getAuthenticatorData({
          rpId: 'localhost',
        }),
        clientDataJSON: WebAuthnP256.getClientDataJSON({
          challenge: ZoneRpcAuthentication.getSignPayload(token),
          origin: 'http://localhost',
        }),
      },
    })

    const serialized = ZoneRpcAuthentication.serialize(token, {
      signature,
    })

    expect(
      ZoneRpcAuthentication.deserialize(serialized),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 4217000006,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"pDP0VIrky3xQ9g4NwmbFfKRh3dAGGiCWI-CCf8S3v-U","origin":"http://localhost","crossOrigin":false}",
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
        "version": 0,
        "zoneId": 6,
        "zonePortal": "0x7069DeC4E64Fd07334A0933eDe836C17259c9B23",
      }
    `)
  })
})

test('e2e', async () => {
  const privateKey = Secp256k1.randomPrivateKey()

  const now = Math.floor(Date.now() / 1000)
  const authentication = ZoneRpcAuthentication.from({
    chainId: 4217000006,
    expiresAt: now + 600,
    issuedAt: now,
    zoneId: 6,
    zonePortal: '0x7069DeC4E64Fd07334A0933eDe836C17259c9B23',
  })

  const signature = Secp256k1.sign({
    payload: ZoneRpcAuthentication.getSignPayload(authentication),
    privateKey,
  })

  const serialized = ZoneRpcAuthentication.serialize(authentication, {
    signature: SignatureEnvelope.from(signature),
  })

  const transport = RpcTransport.fromHttp('https://rpc-zone-005.tempoxyz.dev', {
    fetchOptions: {
      headers: {
        Authorization: `Basic ${btoa(import.meta.env.VITE_TEMPO_CREDENTIALS!)}`,
        [ZoneRpcAuthentication.headerName]: serialized,
      },
    },
  })

  const blockNumber = await transport.request({
    method: 'eth_blockNumber',
  })
  expect(blockNumber).toBeDefined()
  expect(typeof blockNumber).toBe('string')
})

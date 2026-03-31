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
  chainId: 4217000026,
  expiresAt: 1711235160,
  issuedAt: 1711234560,
  zoneId: 26,
  zonePortal: '0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8',
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
        "chainId": 4217000026,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "version": 0,
        "zoneId": 26,
        "zonePortal": "0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8",
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
        "chainId": 4217000026,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "signature": {
            "r": 18118569821309640066725746585949487884242825007452246572100235702777206224302n,
            "s": 46419667458513652580602838308372599096196769294735128367935559788600008107514n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "version": 0,
        "zoneId": 26,
        "zonePortal": "0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8",
      }
    `)
  })
})

describe('getFields', () => {
  test('default', () => {
    const token = ZoneRpcAuthentication.from(authentication)

    expect(ZoneRpcAuthentication.getFields(token)).toMatchInlineSnapshot(
      `"0x000000001a00000000fb5a505a0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c80000000065ff5e000000000065ff6058"`,
    )
    expect(ZoneRpcAuthentication.getSignPayload(token)).toMatchInlineSnapshot(
      `"0x650004cab5e43be40d43b33ce883e980dab5ab77ce7928d56b9cda120316da9d"`,
    )
    expect(
      ZoneRpcAuthentication.getSignPayload(token, {
        userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      }),
    ).toMatchInlineSnapshot(
      `"0xc361772a7796a0e1cff7a8da8d1ba5db13cf1fed88bb53bb4c23402cddb51e44"`,
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
      `"0x280ebf423a8652a4989d4f590b8a75947ba3f28237ecd5509df92e5c3a8335ae66a099c87ff53d8a4d78953a16b0fbbbbf51c2952ba22a2538f1bb94aa67e5fa1b000000001a00000000fb5a505a0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c80000000065ff5e000000000065ff6058"`,
    )
    expect(
      ZoneRpcAuthentication.deserialize(serialized),
    ).toMatchInlineSnapshot(`
      {
        "chainId": 4217000026,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "signature": {
            "r": 18118569821309640066725746585949487884242825007452246572100235702777206224302n,
            "s": 46419667458513652580602838308372599096196769294735128367935559788600008107514n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "version": 0,
        "zoneId": 26,
        "zonePortal": "0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8",
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
        "chainId": 4217000026,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "inner": {
            "signature": {
              "r": 13157937893609283879859776537490301006969916119098760417520014675905043658018n,
              "s": 15478006200349760575038029189394774636774839199126345953743260366289789191585n,
              "yParity": 1,
            },
            "type": "secp256k1",
          },
          "type": "keychain",
          "userAddress": "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
          "version": "v2",
        },
        "version": 0,
        "zoneId": 26,
        "zonePortal": "0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8",
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
        "chainId": 4217000026,
        "expiresAt": 1711235160,
        "issuedAt": 1711234560,
        "signature": {
          "metadata": {
            "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
            "clientDataJSON": "{"type":"webauthn.get","challenge":"ZQAEyrXkO-QNQ7M86IPpgNq1q3fOeSjVa5zaEgMW2p0","origin":"http://localhost","crossOrigin":false}",
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
        "zoneId": 26,
        "zonePortal": "0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8",
      }
    `)
  })
})

test('e2e', async () => {
  const privateKey = Secp256k1.randomPrivateKey()

  const now = Math.floor(Date.now() / 1000)
  const authentication = ZoneRpcAuthentication.from({
    chainId: 4217000026,
    expiresAt: now + 600,
    issuedAt: now,
    zoneId: 26,
    zonePortal: '0x0f1b0cedd7e8226e39ecb161f522c8b1ac45e9c8',
  })

  const signature = Secp256k1.sign({
    payload: ZoneRpcAuthentication.getSignPayload(authentication),
    privateKey,
  })

  const serialized = ZoneRpcAuthentication.serialize(authentication, {
    signature: SignatureEnvelope.from(signature),
  })

  const transport = RpcTransport.fromHttp('https://rpc-zone-003.tempoxyz.dev', {
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

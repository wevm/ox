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
} as const

describe('from', () => {
  test('default', () => {
    const token = ZoneRpcAuthentication.from(authentication)

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
            "r": 97341227674200655943359900797834667459856344667825437562901364609374126504358n,
            "s": 25574506064018953291781981030565094064718304178734850538810668278475710350395n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "version": 0,
        "zoneId": 6,
      }
    `)
  })
})

describe('getFields', () => {
  test('default', () => {
    const token = ZoneRpcAuthentication.from(authentication)

    const fields = ZoneRpcAuthentication.getFields(token)
    // 29 bytes = 58 hex chars + 0x prefix
    expect(fields).toMatch(/^0x[0-9a-f]{58}$/i)

    const payload = ZoneRpcAuthentication.getSignPayload(token)
    // keccak256 = 32 bytes
    expect(payload).toMatch(/^0x[0-9a-f]{64}$/)

    const keychainPayload = ZoneRpcAuthentication.getSignPayload(token, {
      userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    })
    expect(keychainPayload).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keychainPayload).not.toBe(payload)
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

    const deserialized = ZoneRpcAuthentication.deserialize(serialized)
    expect(deserialized.chainId).toBe(authentication.chainId)
    expect(deserialized.zoneId).toBe(authentication.zoneId)
    expect(deserialized.issuedAt).toBe(authentication.issuedAt)
    expect(deserialized.expiresAt).toBe(authentication.expiresAt)
    expect(deserialized.version).toBe(0)
    expect(deserialized.signature).toBeDefined()
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

    const deserialized = ZoneRpcAuthentication.deserialize(serialized)
    expect(deserialized.chainId).toBe(authentication.chainId)
    expect(deserialized.zoneId).toBe(authentication.zoneId)
    expect(deserialized.signature.type).toBe('keychain')
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

    const deserialized = ZoneRpcAuthentication.deserialize(serialized)
    expect(deserialized.chainId).toBe(authentication.chainId)
    expect(deserialized.zoneId).toBe(authentication.zoneId)
    expect(deserialized.signature.type).toBe('webAuthn')
  })
})

const credentials = import.meta.env.VITE_TEMPO_CREDENTIALS
const rpcUrl = 'https://rpc-zone-006-private.tempoxyz.dev'

describe('e2e', () => {
  test.skipIf(!credentials)('succeeds with auth token', async () => {
    const privateKey = Secp256k1.randomPrivateKey()
    const now = Math.floor(Date.now() / 1000)

    const auth = ZoneRpcAuthentication.from({
      chainId: 4217000007,
      expiresAt: now + 600,
      issuedAt: now,
      zoneId: 7,
    })

    const serialized = ZoneRpcAuthentication.serialize(auth, {
      signature: SignatureEnvelope.from(
        Secp256k1.sign({
          payload: ZoneRpcAuthentication.getSignPayload(auth),
          privateKey,
        }),
      ),
    })

    const transport = RpcTransport.fromHttp(rpcUrl, {
      fetchOptions: {
        headers: {
          Authorization: `Basic ${btoa(credentials!)}`,
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

  test.skipIf(!credentials)('fails without auth token', async () => {
    const transport = RpcTransport.fromHttp(rpcUrl, {
      fetchOptions: {
        headers: {
          Authorization: `Basic ${btoa(credentials!)}`,
        },
      },
    })

    await expect(
      transport.request({ method: 'eth_blockNumber' }),
    ).rejects.toThrow()
  })
})

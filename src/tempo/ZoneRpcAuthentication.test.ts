import { PublicKey, RpcTransport, Secp256k1, Signature, WebAuthnP256 } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vp/test'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as ZoneRpcAuthentication from './ZoneRpcAuthentication.js'

const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const

const publicKey = PublicKey.from({
  prefix: 4,
  x: '0xad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f5',
  y: '0x11edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0',
})

const p256Signature = Signature.from({
  r: '0xccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e',
  s: '0x77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35',
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
            "r": "0xd7352eb40bcd052ad97aa4ef761223eaa757d90cc78e4f66d4ea6aaa5dca79a6",
            "s": "0x388aa84fef3c9c0430756b6614248e9ae6d1a7741255dbf1173db5436469443b",
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
const rpcUrl = 'https://rpc-zone-a.testnet.tempo.xyz'

describe('e2e', () => {
  test.skipIf(!credentials)('succeeds with auth token', async () => {
    const privateKey = Secp256k1.randomPrivateKey()
    const now = Math.floor(Date.now() / 1000)

    const auth = ZoneRpcAuthentication.from({
      chainId: 4217000005,
      expiresAt: now + 600,
      issuedAt: now,
      zoneId: 5,
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

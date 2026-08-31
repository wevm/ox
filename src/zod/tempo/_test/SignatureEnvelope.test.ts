import { describe, expect, test } from 'vp/test'
import * as core_SignatureEnvelope from '../../../tempo/SignatureEnvelope.js'
import * as z_SignatureEnvelope from '../SignatureEnvelope.js'
import * as z from 'zod/mini'

const secp256k1 = {
  r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
  s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
  type: 'secp256k1',
  yParity: '0x0',
} as const

const p256 = {
  preHash: false,
  pubKeyX: '0x1ccbe91c075fc7f4f033bfa248db8fccd3565de94bbfb12f3c59ff46c271bf83',
  pubKeyY: '0xce4014c68811f9a21a1fdb2c0e6113e06db7ca93b7404e78dc7ccd5ca89a4ca9',
  r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
  s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
  type: 'p256',
} as const

const multisig =
  '0xf897949dba7f426b711d4893c11611eacf7cc334e7146bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b' as const
const nestedMultisig =
  '0xf8f0949969e2243075b27a8eab61009c59b77ab13b83f6f83ba033333333333333333333333333333333333333333333333333333333333333338001d7d6944f9f5b162a7464bcc260ce44d7ae0d935f9c583701f89cb89a05f897944f9f5b162a7464bcc260ce44d7ae0d935f9c5837f83ba022222222222222222222222222222222222222222222222222222222222222228001d7d6946813eb9362372eef6200f3b1dbc3f819671cba6901f843b841032aa6f3ea7b0b7069720d0f3891983c493d149326c5c957d864ed7371b8475e3e95325079b24491f4b6d68920e4b3bacd7c6094df6ed88b8674864ab559c8fb1b' as const

describe('SignatureEnvelope', () => {
  test('behavior: decodes a secp256k1 envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, secp256k1)).toEqual(
      core_SignatureEnvelope.fromRpc(secp256k1),
    )
  })

  test('behavior: decodes a p256 envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, p256)).toEqual(
      core_SignatureEnvelope.fromRpc(p256),
    )
  })

  test('behavior: decodes a recursive keychain envelope', () => {
    const keychain = {
      signature: secp256k1,
      type: 'keychain',
      userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    } as const
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, keychain)).toEqual(
      core_SignatureEnvelope.fromRpc(keychain),
    )
  })

  test('behavior: decodes a multisig envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, multisig)).toEqual(
      core_SignatureEnvelope.fromRpc(multisig),
    )
  })

  test('behavior: decodes recursive multisig approvals', () => {
    expect(
      z.decode(z_SignatureEnvelope.SignatureEnvelope, nestedMultisig),
    ).toEqual(core_SignatureEnvelope.fromRpc(nestedMultisig))
  })

  test('behavior: round-trips secp256k1 via encode', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, secp256k1)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      core_SignatureEnvelope.toRpc(decoded),
    )
  })

  test('behavior: round-trips multisig via encode', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, multisig)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      multisig,
    )
  })

  test('error: rejects invalid recursive multisig domains before encode', () => {
    const decoded = core_SignatureEnvelope.fromRpc(multisig)
    if (decoded.type !== 'multisig') throw new Error('unreachable')
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        ...decoded,
        signatures: [
          {
            inner: core_SignatureEnvelope.fromRpc(secp256k1),
            type: 'keychain',
            userAddress: decoded.account,
          },
        ],
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects multisig approval counts outside protocol limits', () => {
    const decoded = core_SignatureEnvelope.fromRpc(multisig)
    if (decoded.type !== 'multisig') throw new Error('unreachable')
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        ...decoded,
        signatures: [],
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        ...decoded,
        signatures: Array.from({ length: 9 }, () => decoded.signatures[0]),
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects excess multisig nesting', () => {
    const nested = core_SignatureEnvelope.fromRpc(nestedMultisig)
    if (nested.type !== 'multisig') throw new Error('unreachable')
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        config: {
          ...nested.config,
          owners: [{ owner: nested.account, weight: 1 }],
          version: 1n,
        },
        signatures: [nested],
        type: 'multisig',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects structured multisig RPC envelopes', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        account: '0x9dba7f426b711d4893c11611eacf7cc334e7146b',
        config: {},
        signatures: [],
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects tagged multisig RPC envelopes', () => {
    expect(
      z.safeDecode(
        z_SignatureEnvelope.SignatureEnvelope,
        `0x05${multisig.slice(2)}`,
      ).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('error: rejects an invalid envelope', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        type: 'secp256k1',
      } as never).success,
    ).toBe(false)
  })
})

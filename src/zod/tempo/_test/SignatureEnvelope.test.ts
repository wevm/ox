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

describe('SignatureEnvelope', () => {
  test('decodes a secp256k1 envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, secp256k1)).toEqual(
      core_SignatureEnvelope.fromRpc(secp256k1),
    )
  })

  test('decodes a p256 envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, p256)).toEqual(
      core_SignatureEnvelope.fromRpc(p256),
    )
  })

  test('decodes a recursive keychain envelope', () => {
    const keychain = {
      signature: secp256k1,
      type: 'keychain',
      userAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    } as const
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, keychain)).toEqual(
      core_SignatureEnvelope.fromRpc(keychain),
    )
  })

  test('round-trips secp256k1 via encode', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, secp256k1)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      core_SignatureEnvelope.toRpc(decoded),
    )
  })

  test('rejects an invalid envelope', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        type: 'secp256k1',
      } as never).success,
    ).toBe(false)
  })
})

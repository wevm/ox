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

const multisig = {
  account: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
  signatures: [secp256k1],
} as const

const multisigBootstrap = {
  init: {
    owners: [
      {
        owner: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        weight: 1,
      },
    ],
    salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
    threshold: 1,
  },
  signatures: [secp256k1],
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

  test('decodes an initialized multisig envelope', () => {
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, multisig)).toEqual(
      core_SignatureEnvelope.fromRpc(multisig),
    )
  })

  test('decodes a bootstrap multisig envelope', () => {
    expect(
      z.decode(z_SignatureEnvelope.SignatureEnvelope, multisigBootstrap),
    ).toEqual(core_SignatureEnvelope.fromRpc(multisigBootstrap))
  })

  test('decodes recursive multisig approvals', () => {
    const nested = {
      ...multisig,
      signatures: [
        {
          account: '0x1111111111111111111111111111111111111111',
          signatures: [secp256k1],
        },
      ],
    } as const
    expect(z.decode(z_SignatureEnvelope.SignatureEnvelope, nested)).toEqual(
      core_SignatureEnvelope.fromRpc(nested),
    )
  })

  test('round-trips secp256k1 via encode', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, secp256k1)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      core_SignatureEnvelope.toRpc(decoded),
    )
  })

  test('round-trips initialized multisig via encode', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, multisig)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      core_SignatureEnvelope.toRpc(decoded),
    )
  })

  test('round-trips bootstrap multisig via encode', () => {
    const decoded = z.decode(
      z_SignatureEnvelope.SignatureEnvelope,
      multisigBootstrap,
    )
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      multisigBootstrap,
    )
  })

  test('rejects invalid recursive multisig domains before encode', () => {
    const invalid = {
      account: multisig.account,
      signatures: [
        {
          inner: core_SignatureEnvelope.fromRpc(secp256k1),
          type: 'keychain',
          userAddress: multisig.account,
        },
      ],
      type: 'multisig',
    } as const

    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, invalid as never)
        .success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects legacy multisig approval encoding', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        signatures: [
          core_SignatureEnvelope.serialize(
            core_SignatureEnvelope.fromRpc(secp256k1),
          ),
        ],
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects multisig approval counts outside protocol limits', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        signatures: [],
      }).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        signatures: Array.from({ length: 9 }, () => secp256k1),
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects invalid recursive multisig approvals', () => {
    const keychain = {
      signature: secp256k1,
      type: 'keychain',
      userAddress: multisig.account,
    } as const
    const depth2 = {
      account: '0x1111111111111111111111111111111111111111',
      signatures: [secp256k1],
    } as const
    const depth3 = {
      account: '0x2222222222222222222222222222222222222222',
      signatures: [depth2],
    } as const

    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        signatures: [keychain],
      }).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        signatures: [depth3],
      }).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects mixed multisig initialization fields', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisigBootstrap,
        account: multisig.account,
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects tagged multisig RPC envelopes', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...multisig,
        type: 'multisig',
      } as never).success,
    ).toMatchInlineSnapshot(`false`)
  })

  test('rejects an invalid envelope', () => {
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        type: 'secp256k1',
      } as never).success,
    ).toBe(false)
  })
})

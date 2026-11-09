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

const envelope = core_SignatureEnvelope.from({
  account: '0x2222222222222222222222222222222222222222',
  config: {
    version: 2n,
    threshold: 1,
    owners: [
      { owner: '0x1111111111111111111111111111111111111111', weight: 1 },
    ],
  },
  signatures: [
    core_SignatureEnvelope.fromRpc(
      secp256k1,
    ) as core_SignatureEnvelope.Primitive,
  ],
})
const configurable = core_SignatureEnvelope.toRpc(envelope)

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

  test('round-trips versioned configurable RPC bytes', () => {
    const decoded = z.decode(
      z_SignatureEnvelope.SignatureEnvelope,
      configurable,
    )
    expect(decoded).toEqual(envelope)
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      configurable,
    )
  })

  test('round-trips a configurable delegate in a keychain', () => {
    const rpc = {
      type: 'keychain',
      version: 'v2',
      userAddress: '0x3333333333333333333333333333333333333333',
      signature: configurable,
    } as const
    expect(
      z.encode(
        z_SignatureEnvelope.SignatureEnvelope,
        z.decode(z_SignatureEnvelope.SignatureEnvelope, rpc),
      ),
    ).toEqual(rpc)
  })

  test('rejects legacy RPC shapes and malformed bytes', () => {
    for (const rpc of [
      { account: envelope.account, signatures: [secp256k1] },
      '0xc0',
      '0x',
    ])
      expect(
        z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, rpc as never)
          .success,
      ).toMatchInlineSnapshot('false')
  })

  test('rejects recursive and empty owner approvals', () => {
    for (const signatures of [
      [],
      [envelope],
      [{ type: 'keychain', userAddress: envelope.account, inner: envelope }],
    ])
      expect(
        z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
          ...envelope,
          signatures,
        } as never).success,
      ).toMatchInlineSnapshot('false')
  })
  test('rejects keychain V1 configurable delegates', () => {
    const rpc = {
      type: 'keychain',
      version: 'v1',
      userAddress: envelope.account,
      signature: configurable,
    } as const
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, rpc).success,
    ).toMatchInlineSnapshot('false')
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        type: 'keychain',
        version: 'v1',
        userAddress: envelope.account,
        inner: envelope,
      }).success,
    ).toMatchInlineSnapshot('false')
  })

  test('round-trips primitive RPC envelopes', () => {
    for (const rpc of [secp256k1, p256])
      expect(
        z.encode(
          z_SignatureEnvelope.SignatureEnvelope,
          z.decode(z_SignatureEnvelope.SignatureEnvelope, rpc),
        ),
      ).toEqual(rpc)
  })
})

describe('Keychain', () => {
  test('rejects V1 wrappers with nested configurable delegates', () => {
    const inner = {
      inner: envelope,
      type: 'keychain',
      userAddress: envelope.account,
      version: 'v2',
    } as const
    const value = {
      inner,
      type: 'keychain',
      userAddress: envelope.account,
      version: 'v1',
    } as const
    const rpc = {
      signature: core_SignatureEnvelope.toRpc(inner),
      type: 'keychain',
      userAddress: envelope.account,
      version: 'v1',
    } as const
    expect(
      z.safeParse(z_SignatureEnvelope.Keychain, value).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeParse(z_SignatureEnvelope.KeychainRpc, rpc).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, value).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, rpc).success,
    ).toMatchInlineSnapshot(`false`)
    expect(
      z.safeEncode(z_SignatureEnvelope.SignatureEnvelope, {
        ...value,
        version: 'v2',
      }).success,
    ).toMatchInlineSnapshot(`true`)
    expect(
      z.safeDecode(z_SignatureEnvelope.SignatureEnvelope, {
        ...rpc,
        version: 'v2',
      }).success,
    ).toMatchInlineSnapshot(`true`)
  })
})

// Node fixture (tempoxyz/tempo `exp/attested-signers`, `attested.rs` `tests::signed`), as
// `src/tempo/SignatureEnvelope.test.ts` derives it.
const attestedRpc = {
  policyId: `0x${'aa'.repeat(32)}`,
  programKey:
    '0x0217e617f0b6443928278f96999e69a23a4f2c152bdf6d6cdf66e5b80282d4ed194a7debcb97712d2dda3ca85aa8765a56f45fc758599652f2897c65306e5794',
  signature:
    '0xc377749188175be68110ca4583693ce52050e1d84ab6d0308ea063695bdfdbf81aaeb8779f72f84bbf22c9627c8091dd13f64977848992ebd48a7efc5d6baf2d',
  slot: 1,
  userTag: `0x${'bb'.repeat(32)}`,
  validUntil: 1_800_000_600,
} as const

describe('Attested', () => {
  test('round-trips the RPC envelope', () => {
    const decoded = z.decode(z_SignatureEnvelope.SignatureEnvelope, attestedRpc)
    expect(decoded).toEqual(core_SignatureEnvelope.fromRpc(attestedRpc))
    expect(decoded.type).toBe('attested')
    expect(z.encode(z_SignatureEnvelope.SignatureEnvelope, decoded)).toEqual(
      attestedRpc,
    )
  })

  test('accepts attested owner approvals', () => {
    const approval = core_SignatureEnvelope.fromRpc(attestedRpc)
    expect(
      z.safeParse(z_SignatureEnvelope.Configurable, {
        ...envelope,
        signatures: [approval],
      }).success,
    ).toBe(true)
  })

  test('rejects a slot out of range and a high s', () => {
    expect(
      z.safeParse(z_SignatureEnvelope.AttestedRpc, { ...attestedRpc, slot: 8 })
        .success,
    ).toBe(false)
    expect(
      z.safeParse(z_SignatureEnvelope.AttestedRpc, {
        ...attestedRpc,
        signature: `${attestedRpc.signature.slice(0, 66)}${'ff'.repeat(32)}`,
      }).success,
    ).toBe(false)
  })
})

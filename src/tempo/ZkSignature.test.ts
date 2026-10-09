import { Address, Hex, Rlp, Secp256k1 } from 'ox'
import { KeyAuthorization, SignatureEnvelope, ZkSignature } from 'ox/tempo'
import { describe, expect, test } from 'vitest'
import { transaction } from '../../test/tempo/zk.js'

// The node returns `null` for absent fields, which `KeyAuthorization.Rpc` omits.
const authorization = KeyAuthorization.fromRpc(
  transaction.keyAuthorization as unknown as KeyAuthorization.Rpc,
)
const zk = SignatureEnvelope.fromRpc(transaction.keyAuthorization.signature)
if (zk.type !== 'zk') throw new Error('expected a ZK signature')
const { accessKeySignature, type: _, ...credential } = zk

const messageSignature = {
  addressSeed: `0x${'01'.repeat(32)}`,
  issuedAt: 1760000000,
  issuer: `0x${'02'.repeat(32)}`,
  keyHash: `0x${'03'.repeat(32)}`,
  proof: `0x${'04'.repeat(256)}`,
  publisherId: `0x${'05'.repeat(32)}`,
  scheme: 2,
} as const satisfies ZkSignature.MessageSignature
const serializedMessage =
  '0xf9018d02a00505050505050505050505050505050505050505050505050505050505050505a00202020202020202020202020202020202020202020202020202020202020202a00303030303030303030303030303030303030303030303030303030303030303a001010101010101010101010101010101010101010101010101010101010101018468e77800b9010004040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404040404'

describe('assert', () => {
  test('default', () => {
    expect(() => ZkSignature.assert(credential)).not.toThrow()
  })

  test('error: rejects values outside the field', () => {
    expect(() =>
      ZkSignature.assert({
        ...credential,
        addressSeed: `0x${'ff'.repeat(32)}`,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: \`addressSeed\` is not a BN254 scalar field element.]`,
    )
  })

  test('error: rejects malformed fields', () => {
    expect(() =>
      ZkSignature.assert({
        ...credential,
        proof: Hex.slice(credential.proof, 1),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: proof is not 256 bytes.]`,
    )
    expect(() =>
      ZkSignature.assert({ ...credential, publisherId: '0x01' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: \`publisherId\` is not 32 bytes.]`,
    )
    expect(() =>
      ZkSignature.assert({ ...credential, scheme: 256 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: scheme is not a byte.]`,
    )
    expect(() =>
      ZkSignature.assert({ ...credential, validUntil: -1 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: \`validUntil\` is not a timestamp.]`,
    )
  })
})

describe('fromTuple', () => {
  test('default', () => {
    expect(ZkSignature.fromTuple(ZkSignature.toTuple(credential))).toEqual(
      credential,
    )
  })

  test('error: rejects non-canonical integers', () => {
    const [scheme, ...rest] = ZkSignature.toTuple(credential)
    expect(() =>
      ZkSignature.fromTuple([Hex.concat('0x00', scheme), ...rest]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: \`scheme\` is not a canonical integer.]`,
    )
  })
})

describe('getAddress', () => {
  test('default', () => {
    expect(
      Address.isEqual(ZkSignature.getAddress(credential), transaction.from),
    ).toBe(true)
  })

  test('behavior: passport namespace', () => {
    // Expected address from ethers.
    expect(ZkSignature.getAddress({ ...messageSignature })).toBe(
      '0x20bc64ccded09957be3b68220c924a1b8516100b',
    )
  })

  test('error: rejects unknown schemes', () => {
    expect(() =>
      ZkSignature.getAddress({ ...credential, scheme: 3 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.UnknownSchemeError: ZK signature scheme \`3\` is unknown.]`,
    )
  })
})

describe('serializeMessage', () => {
  test('default', () => {
    // Expected RLP from ethers.
    expect(ZkSignature.serializeMessage(messageSignature)).toBe(
      serializedMessage,
    )
  })

  test('error: invalid field', () => {
    expect(() =>
      ZkSignature.serializeMessage({ ...messageSignature, proof: '0x04' }),
    ).toThrow(ZkSignature.InvalidCredentialError)
  })
})

describe('deserializeMessage', () => {
  test('default', () => {
    expect(ZkSignature.deserializeMessage(serializedMessage)).toEqual(
      messageSignature,
    )
  })

  test('error: a ZK signature credential', () => {
    expect(() =>
      ZkSignature.deserializeMessage(
        Rlp.fromHex(
          ZkSignature.toTuple({ ...messageSignature, validUntil: 1 }),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: expected seven canonical message signature fields.]`,
    )
  })

  test('error: non-canonical integer', () => {
    const [scheme, ...rest] = Rlp.toHex(serializedMessage) as Hex.Hex[]
    expect(scheme).toBe('0x02')
    expect(() =>
      ZkSignature.deserializeMessage(Rlp.fromHex(['0x0002', ...rest])),
    ).toThrow(ZkSignature.InvalidCredentialError)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const payload = KeyAuthorization.getSignPayload(authorization)
    expect(
      ZkSignature.getSignPayload({ credential, payload }),
    ).toMatchInlineSnapshot(
      `"0x68fd94fab917f0a5b798c6004f16646cdb494be938431b78392ed133aaa83401"`,
    )
  })

  test('behavior: the access key signs it', () => {
    const payload = KeyAuthorization.getSignPayload(authorization)
    if (accessKeySignature.type !== 'secp256k1')
      throw new Error('expected a secp256k1 access key signature')
    const accessKey = Secp256k1.recoverAddress({
      payload: ZkSignature.getSignPayload({ credential, payload }),
      signature: accessKeySignature.signature,
    })
    expect(Address.isEqual(accessKey, transaction.keyAuthorization.keyId)).toBe(
      true,
    )
  })

  test('error: rejects payloads that are not 32 bytes', () => {
    expect(() =>
      ZkSignature.getSignPayload({ credential, payload: '0xdeadbeef' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[ZkSignature.InvalidCredentialError: Invalid ZK signature credential: payload is not 32 bytes.]`,
    )
  })
})

describe('toTuple', () => {
  test('default', () => {
    const [
      scheme,
      publisherId,
      issuer,
      keyHash,
      addressSeed,
      issuedAt,
      validUntil,
      proof,
    ] = ZkSignature.toTuple(credential)
    expect({
      addressSeed,
      issuedAt,
      issuer,
      keyHash,
      proof: Hex.size(proof),
      publisherId,
      scheme,
      validUntil,
    }).toMatchInlineSnapshot(`
      {
        "addressSeed": "0x05667e1ce177c0206e082a863a572ba92d755d50a314e680f5036f504395b5bb",
        "issuedAt": "0x6ac6aa54",
        "issuer": "0x1656ea090c49c9b4a8872fc6540d3c210b34ad42859aff31f059c28e999ba45d",
        "keyHash": "0x14d3f177c646a83e556512bc1cd8168982e09509d281dad23664b24d0e89cddb",
        "proof": 256,
        "publisherId": "0xb2fdbde0aad8da84287b254c3b0e164af920692de35ca2fd27f6ea150ee143ac",
        "scheme": "0x1",
        "validUntil": "0x6ac6ac70",
      }
    `)
  })
})

import { Cbor, CoseKey, P256, PublicKey } from 'ox'
import { describe, expect, test } from 'vp/test'

describe('fromPublicKey', () => {
  test('default', () => {
    const { publicKey } = P256.createKeyPair()
    const coseKey = CoseKey.fromPublicKey(publicKey)
    expect(coseKey).toBeDefined()
    expect(typeof coseKey).toBe('string')
    expect(coseKey.startsWith('0x')).toBe(true)
  })
})

describe('toPublicKey', () => {
  test('default', () => {
    const { publicKey } = P256.createKeyPair()
    const coseKey = CoseKey.fromPublicKey(publicKey)
    const recovered = CoseKey.toPublicKey(coseKey)
    expect(recovered).toStrictEqual(publicKey)
  })
})

describe('roundtrip', () => {
  test('roundtrip with known public key', () => {
    const publicKey = PublicKey.from({
      x: '0xeee72c4fc66e2670b0f606fcb54ce453b8ae09d0661303dd4ad8d4063be21287',
      y: '0x2093aff8b065c247c742e6833937ba987fb0f871e61fcfc6763fd9144611210f',
    })
    const coseKey = CoseKey.fromPublicKey(publicKey)
    const recovered = CoseKey.toPublicKey(coseKey)
    expect(recovered).toStrictEqual(publicKey)
  })

  test('roundtrip with real attestation COSE key', () => {
    const coseKeyHex =
      '0xa5010203262001215820eee72c4fc66e2670b0f606fcb54ce453b8ae09d0661303dd4ad8d4063be212872258202093aff8b065c247c742e6833937ba987fb0f871e61fcfc6763fd9144611210f'
    const publicKey = CoseKey.toPublicKey(coseKeyHex)
    expect(publicKey).toStrictEqual(
      PublicKey.from({
        x: '0xeee72c4fc66e2670b0f606fcb54ce453b8ae09d0661303dd4ad8d4063be21287',
        y: '0x2093aff8b065c247c742e6833937ba987fb0f871e61fcfc6763fd9144611210f',
      }),
    )
    // Re-encode and verify match
    const reEncoded = CoseKey.fromPublicKey(publicKey)
    expect(reEncoded).toBe(coseKeyHex)
  })
})

describe('errors', () => {
  test('invalid COSE key throws', () => {
    // CBOR map without x/y byte arrays
    expect(() => CoseKey.toPublicKey('0xa10102')).toThrow(
      CoseKey.InvalidCoseKeyError,
    )
  })

  function makeCoseKey(overrides: {
    kty?: number
    alg?: number
    crv?: number
    x?: Uint8Array
    y?: Uint8Array
  }) {
    const x = overrides.x ?? new Uint8Array(32).fill(0xaa)
    const y = overrides.y ?? new Uint8Array(32).fill(0xbb)
    return Cbor.encode(
      new Map<number, unknown>([
        [1, overrides.kty ?? 2],
        [3, overrides.alg ?? -7],
        [-1, overrides.crv ?? 1],
        [-2, x],
        [-3, y],
      ]),
    )
  }

  test('rejects wrong kty', () => {
    expect(() => CoseKey.toPublicKey(makeCoseKey({ kty: 1 }))).toThrow(
      CoseKey.InvalidCoseKeyError,
    )
  })

  test('rejects wrong alg', () => {
    expect(() => CoseKey.toPublicKey(makeCoseKey({ alg: -8 }))).toThrow(
      CoseKey.InvalidCoseKeyError,
    )
  })

  test('rejects wrong crv', () => {
    expect(() => CoseKey.toPublicKey(makeCoseKey({ crv: 2 }))).toThrow(
      CoseKey.InvalidCoseKeyError,
    )
  })

  test('rejects wrong x coordinate length', () => {
    expect(() =>
      CoseKey.toPublicKey(makeCoseKey({ x: new Uint8Array(31).fill(0xaa) })),
    ).toThrow(CoseKey.InvalidCoseKeyError)
  })

  test('rejects wrong y coordinate length', () => {
    expect(() =>
      CoseKey.toPublicKey(makeCoseKey({ y: new Uint8Array(33).fill(0xbb) })),
    ).toThrow(CoseKey.InvalidCoseKeyError)
  })
})

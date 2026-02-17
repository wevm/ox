import { CoseKey, P256, PublicKey } from 'ox'
import { describe, expect, test } from 'vitest'

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
      x: 108058905462353399599412887269393158541451912165746768801221323097156211577479n,
      y: 14734952183441233246695696377579450501147029832688498617254314309528960704783n,
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
        x: 108058905462353399599412887269393158541451912165746768801221323097156211577479n,
        y: 14734952183441233246695696377579450501147029832688498617254314309528960704783n,
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
})

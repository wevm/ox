import { describe, expect, test } from 'vitest'
import { Credential } from '../index.js'

describe('Credential.serialize', () => {
  test('default', () => {
    const credential: Credential.Credential = {
      attestationObject: new Uint8Array([1, 2, 3]).buffer as ArrayBuffer,
      clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      publicKey: {
        prefix: 4,
        x: 77587693192652859874025541476425832478302972220661277688017673393936226333095n,
        y: 97933141135755737384413290261786792525004108403409931527059712582886746584404n,
      },
      raw: {
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        type: 'public-key',
        authenticatorAttachment: 'platform',
        rawId: new Uint8Array([155, 95, 155, 48]).buffer as ArrayBuffer,
        response: {
          clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
        },
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Credential.serialize(credential)

    expect(typeof serialized.publicKey).toBe('string')
    expect(typeof serialized.attestationObject).toBe('string')
    expect(typeof serialized.clientDataJSON).toBe('string')
    expect(typeof serialized.raw.rawId).toBe('string')
    expect(typeof serialized.raw.response.clientDataJSON).toBe('string')
    expect(() => JSON.stringify(serialized)).not.toThrow()
    expect(serialized).toMatchInlineSnapshot(`
      {
        "attestationObject": "AQID",
        "clientDataJSON": "e30",
        "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
        "publicKey": "0x04ab891400140fc4f8e941ce0ff90e419de9470acaca613bbd717a4775435031a7d884318e919fd3b3e5a631d866d8a380b44063e70f0c381ee16e0652f7f97554",
        "raw": {
          "authenticatorAttachment": "platform",
          "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
          "rawId": "m1-bMA",
          "response": {
            "clientDataJSON": "e30",
          },
          "type": "public-key",
        },
      }
    `)
  })

  test('with attestationObject in response', () => {
    const credential: Credential.Credential = {
      attestationObject: new Uint8Array([4, 5, 6]).buffer as ArrayBuffer,
      clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
      id: 'test-id',
      publicKey: {
        prefix: 4,
        x: 77587693192652859874025541476425832478302972220661277688017673393936226333095n,
        y: 97933141135755737384413290261786792525004108403409931527059712582886746584404n,
      },
      raw: {
        id: 'test-id',
        type: 'public-key',
        authenticatorAttachment: null,
        rawId: new Uint8Array([1, 2, 3]).buffer as ArrayBuffer,
        response: {
          clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
          attestationObject: new Uint8Array([4, 5, 6]).buffer as ArrayBuffer,
        } as any,
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Credential.serialize(credential)
    expect(typeof serialized.attestationObject).toBe('string')
    expect(typeof serialized.clientDataJSON).toBe('string')
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })
})

describe('Credential.deserialize', () => {
  test('default', () => {
    const serialized: Credential.Credential<true> = {
      attestationObject: 'AQID',
      clientDataJSON: 'e30',
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      publicKey:
        '0x04ab891400140fc4f8e941ce0ff90e419de9470acaca613bbd717a4775435031a7d884318e919fd3b3e5a631d866d8a380b44063e70f0c381ee16e0652f7f97554',
      raw: {
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        type: 'public-key',
        authenticatorAttachment: 'platform',
        rawId: 'm1-bMA',
        response: {
          clientDataJSON: 'e30',
        },
      },
    }

    const credential = Credential.deserialize(serialized)

    expect(credential.id).toBe(serialized.id)
    expect(credential.publicKey.prefix).toBe(4)
    expect(typeof credential.publicKey.x).toBe('bigint')
    expect(typeof credential.publicKey.y).toBe('bigint')
    expect(credential.raw.rawId).toBeInstanceOf(ArrayBuffer)
    expect(credential.raw.response.clientDataJSON).toBeInstanceOf(ArrayBuffer)
  })

  test('round-trip', () => {
    const original: Credential.Credential = {
      attestationObject: new Uint8Array([1, 2, 3]).buffer as ArrayBuffer,
      clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      publicKey: {
        prefix: 4,
        x: 77587693192652859874025541476425832478302972220661277688017673393936226333095n,
        y: 97933141135755737384413290261786792525004108403409931527059712582886746584404n,
      },
      raw: {
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        type: 'public-key',
        authenticatorAttachment: 'platform',
        rawId: new Uint8Array([155, 95, 155, 48]).buffer as ArrayBuffer,
        response: {
          clientDataJSON: new Uint8Array([123, 125]).buffer as ArrayBuffer,
        },
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Credential.serialize(original)
    const deserialized = Credential.deserialize(serialized)

    expect(deserialized.id).toBe(original.id)
    expect(deserialized.publicKey).toEqual(original.publicKey)
    expect(Array.from(new Uint8Array(deserialized.raw.rawId))).toEqual(
      Array.from(new Uint8Array(original.raw.rawId)),
    )
    expect(
      Array.from(new Uint8Array(deserialized.raw.response.clientDataJSON)),
    ).toEqual(Array.from(new Uint8Array(original.raw.response.clientDataJSON)))
  })
})

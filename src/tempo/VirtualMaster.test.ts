import { createKeccak } from 'hash-wasm'
import { Bytes, Hash } from 'ox'
import { TempoAddress, VirtualMaster } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const tempoAddress = TempoAddress.format(address)
const salt =
  '0x00000000000000000000000000000000000000000000000000000000abf52baf'
const masterId = '0x58e21090'
const registrationHash =
  '0x0000000058e21090d8f4bee424b90cddc2378aefa1bbbfa1443631a929ae966d'

describe('getRegistrationHash', () => {
  test('raw address', () => {
    expect(
      VirtualMaster.getRegistrationHash({
        address,
        salt,
      }),
    ).toBe(registrationHash)
  })

  test('tempo address', () => {
    expect(
      VirtualMaster.getRegistrationHash({
        address: tempoAddress,
        salt,
      }),
    ).toBe(registrationHash)
  })
})

describe('getMasterId', () => {
  test('default', () => {
    expect(
      VirtualMaster.getMasterId({
        address,
        salt,
      }),
    ).toBe(masterId)
  })
})

describe('validateSalt', () => {
  test('returns true for valid salt', () => {
    expect(VirtualMaster.validateSalt({ address, salt })).toBe(true)
  })

  test('returns false for invalid salt', () => {
    expect(VirtualMaster.validateSalt({ address, salt: 0n })).toBe(false)
  })
})

describe('mineSalt', () => {
  test('finds the first salt in range with the default keccak path', () => {
    expect(
      VirtualMaster.mineSalt({
        address,
        count: 16,
        start: 0xabf52ba0n,
      }),
    ).toMatchInlineSnapshot(`
      {
        "masterId": "0x58e21090",
        "registrationHash": "0x0000000058e21090d8f4bee424b90cddc2378aefa1bbbfa1443631a929ae966d",
        "salt": "0x00000000000000000000000000000000000000000000000000000000abf52baf",
      }
    `)
  })

  test('returns undefined when no salt is found in range', () => {
    expect(
      VirtualMaster.mineSalt({
        address,
        count: 1,
        start: 0n,
      }),
    ).toBeUndefined()
  })

  test('throws for a non-integer count', () => {
    expect(() =>
      VirtualMaster.mineSalt({
        address,
        count: 1.5,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Count "1.5" is invalid. Expected a positive safe integer.]`,
    )
  })

  test('throws for a non-finite count', () => {
    expect(() =>
      VirtualMaster.mineSalt({
        address,
        count: Number.POSITIVE_INFINITY,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Count "Infinity" is invalid. Expected a positive safe integer.]`,
    )
  })

  test('uses an injected keccak backend', () => {
    const keccak256 = new TestKeccak256()

    const result = VirtualMaster.mineSalt(
      {
        address,
        count: 16,
        start: 0xabf52ba0n,
      },
      { keccak256 },
    )

    expect(result).toEqual({ masterId, registrationHash, salt })
    expect(keccak256.calls).toMatchInlineSnapshot(`
      {
        "digest": 16,
        "init": 16,
        "update": 32,
      }
    `)
  })

  test('uses a hash-wasm keccak backend', async () => {
    const keccak256 = await createKeccak(256)

    const result = VirtualMaster.mineSalt(
      {
        address,
        count: 16,
        start: 0xabf52ba0n,
      },
      { keccak256 },
    )

    expect(result).toEqual({ masterId, registrationHash, salt })
  })

  test('throws for an injected backend with an invalid digest size', () => {
    expect(() =>
      VirtualMaster.mineSalt(
        {
          address,
          count: 1,
        },
        { keccak256: new InvalidDigestKeccak256() },
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Injected Keccak-256 backend returned 4 bytes, expected 32 bytes.]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(VirtualMaster)).toMatchInlineSnapshot(`
    [
      "getRegistrationHash",
      "getMasterId",
      "validateSalt",
      "mineSalt",
    ]
  `)
})

class TestKeccak256 {
  buffer = new Uint8Array()
  calls = {
    digest: 0,
    init: 0,
    update: 0,
  }

  init() {
    this.calls.init++
    this.buffer = new Uint8Array()
    return this
  }

  update(value: Uint8Array) {
    this.calls.update++
    this.buffer = Bytes.concat(this.buffer, value)
    return this
  }

  digest() {
    this.calls.digest++
    return Hash.keccak256(this.buffer, { as: 'Hex' }).slice(2)
  }
}

class InvalidDigestKeccak256 {
  init() {
    return this
  }

  update(_value: Uint8Array) {
    return this
  }

  digest() {
    return new Uint8Array([0, 0, 0, 0])
  }
}

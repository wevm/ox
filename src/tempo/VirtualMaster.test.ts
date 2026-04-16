import { TempoAddress, VirtualMaster } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const tempoAddress = TempoAddress.format(address)
const salt =
  '0x00000000000000000000000000000000000000000000000000000000abf52baf'
const masterId = '0x58e21090'
const registrationHash =
  '0x0000000058e21090d8f4bee424b90cddc2378aefa1bbbfa1443631a929ae966d'
const virtualAddress = '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506'
const tip20Address = '0x20c0000000000000000000000000000000000001'

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

  test.each([
    ['zero address', '0x0000000000000000000000000000000000000000'],
    ['virtual address', virtualAddress],
    ['TIP-20 token address', tip20Address],
  ])('rejects %s as a virtual master', (_label, invalidAddress) => {
    expect(() =>
      VirtualMaster.mineSalt(
        {
          address: invalidAddress as VirtualMaster.mineSalt.Value['address'],
          count: 1,
        },
      ),
    ).toThrowError()
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

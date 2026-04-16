import { TempoAddress, VirtualAddress } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const address = '0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506'
const tempoAddress = TempoAddress.format(address)

describe('from', () => {
  test('default', () => {
    expect(
      VirtualAddress.from({
        masterId: '0x58e21090',
        userTag: '0x010203040506',
      }),
    ).toMatchInlineSnapshot(`"0x58e21090fdfdfdfdfdfdfdfdfdfd010203040506"`)
  })

  test('pads number inputs', () => {
    expect(
      VirtualAddress.from({
        masterId: 1,
        userTag: 2,
      }),
    ).toMatchInlineSnapshot(`"0x00000001fdfdfdfdfdfdfdfdfdfd000000000002"`)
  })
})

describe('parse', () => {
  test('raw address', () => {
    expect(VirtualAddress.parse(address)).toMatchInlineSnapshot(`
      {
        "masterId": "0x58e21090",
        "userTag": "0x010203040506",
      }
    `)
  })

  test('tempo address', () => {
    expect(VirtualAddress.parse(tempoAddress)).toMatchInlineSnapshot(`
      {
        "masterId": "0x58e21090",
        "userTag": "0x010203040506",
      }
    `)
  })

  test('error: not virtual', () => {
    expect(() =>
      VirtualAddress.parse('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[VirtualAddress.InvalidMagicError: Address "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" does not contain the TIP-1022 virtual address marker.]`,
    )
  })
})

describe('isVirtual', () => {
  test('returns true for virtual address', () => {
    expect(VirtualAddress.isVirtual(address)).toBe(true)
  })

  test('returns false for non-virtual address', () => {
    expect(
      VirtualAddress.isVirtual('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
    ).toBe(false)
  })
})

describe('validate', () => {
  test('returns true for virtual address', () => {
    expect(VirtualAddress.validate(tempoAddress)).toBe(true)
  })

  test('returns false for invalid value', () => {
    expect(VirtualAddress.validate('invalid')).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(VirtualAddress)).toMatchInlineSnapshot(`
    [
      "magic",
      "from",
      "isVirtual",
      "parse",
      "validate",
      "InvalidMagicError",
    ]
  `)
})

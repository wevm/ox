import { Address } from 'ox'
import { TempoAddress } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const rawAddress = Address.checksum(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
)

describe('resolve', () => {
  test('hex address passthrough', () => {
    expect(TempoAddress.resolve(rawAddress)).toBe(rawAddress)
  })

  test('tempo address', () => {
    const tempoAddr = TempoAddress.format(rawAddress)
    expect(TempoAddress.resolve(tempoAddr)).toBe(rawAddress)
  })
})

describe('format', () => {
  test('default', () => {
    expect(TempoAddress.format(rawAddress)).toMatchInlineSnapshot(
      `"tempox0x742d35cc6634c0532925a3b844bc9e7595f2bd28"`,
    )
  })

  test('tempo address input', () => {
    const tempoAddr = TempoAddress.format(rawAddress)
    expect(TempoAddress.format(tempoAddr)).toBe(tempoAddr)
  })

  test('lowercase output', () => {
    const result = TempoAddress.format(rawAddress)
    expect(result).toBe(result.toLowerCase())
  })

  test('address length', () => {
    expect(TempoAddress.format(rawAddress).length).toBe(48)
  })
})

describe('parse', () => {
  test('default', () => {
    const encoded = TempoAddress.format(rawAddress)
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
      }
    `)
  })

  test('uppercase hex', () => {
    expect(
      TempoAddress.parse('tempox0x742D35CC6634C0532925A3B844BC9E7595F2BD28')
        .address,
    ).toBe(rawAddress)
  })

  test('error: invalid prefix', () => {
    expect(() =>
      TempoAddress.parse('bitcoin0x742d35cc6634c0532925a3b844bc9e7595f2bd28'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TempoAddress.InvalidPrefixError: Tempo address "bitcoin0x742d35cc6634c0532925a3b844bc9e7595f2bd28" has an invalid prefix. Expected "tempox".]`,
    )
  })

  test('error: invalid hex', () => {
    expect(() => TempoAddress.parse('tempox0xinvalid')).toThrow()
  })

  test('error: missing 0x prefix', () => {
    expect(() => TempoAddress.parse('tempox742d35cc')).toThrow()
  })
})

describe('validate', () => {
  test('valid address', () => {
    const encoded = TempoAddress.format(rawAddress)
    expect(TempoAddress.validate(encoded)).toBe(true)
  })

  test('invalid address', () => {
    expect(TempoAddress.validate('invalid')).toBe(false)
  })

  test('invalid hex', () => {
    expect(TempoAddress.validate('tempox0xinvalid')).toBe(false)
  })
})

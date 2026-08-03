import { Hardfork } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(Hardfork)).toMatchInlineSnapshot(`
    [
      "hardforks",
      "latest",
      "atLeast",
      "gas",
      "UnknownHardforkError",
    ]
  `)
})

describe('atLeast', () => {
  test('default', () => {
    expect(Hardfork.atLeast('osaka', 'prague')).toBe(true)
    expect(Hardfork.atLeast('prague', 'prague')).toBe(true)
    expect(Hardfork.atLeast('cancun', 'prague')).toBe(false)
  })

  test('error: unknown hardfork', () => {
    expect(() =>
      // @ts-expect-error
      Hardfork.atLeast('verkle', 'prague'),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hardfork.UnknownHardforkError: Unknown hardfork \`verkle\`.

      Known hardforks: cancun, prague, osaka.]
    `)
  })
})

describe('gas', () => {
  test('default', () => {
    expect(Hardfork.gas('osaka')).toMatchInlineSnapshot(`
      {
        "accessListAddressGas": 2400n,
        "accessListStorageKeyGas": 1900n,
        "authorizationGas": 25000n,
        "authorizationRefund": 12500n,
        "blob": {
          "baseFeeUpdateFraction": 5007716n,
          "gasPerBlob": 131072n,
          "max": 9,
          "maxPerTransaction": 6,
          "minBaseFee": 1n,
          "target": 6,
        },
        "coldAccountAccessGas": 2600n,
        "coldSloadGas": 2100n,
        "floorTokenGas": 10n,
        "initcodeWordGas": 2n,
        "maxCodeSize": 24576,
        "maxInitcodeSize": 49152,
        "refundQuotient": 5n,
        "txCreateGas": 32000n,
        "txDataNonzeroGas": 16n,
        "txDataZeroGas": 4n,
        "txGas": 21000n,
        "txGasLimitCap": 16777216n,
        "warmReadGas": 100n,
      }
    `)
  })

  test('behavior: rules absent before their fork', () => {
    const cancun = Hardfork.gas('cancun')
    expect(cancun.floorTokenGas).toBeUndefined()
    expect(cancun.authorizationGas).toBeUndefined()
    expect(cancun.txGasLimitCap).toBeUndefined()
    expect(cancun.blob).toMatchInlineSnapshot(`
      {
        "baseFeeUpdateFraction": 3338477n,
        "gasPerBlob": 131072n,
        "max": 6,
        "maxPerTransaction": 6,
        "minBaseFee": 1n,
        "target": 3,
      }
    `)

    const prague = Hardfork.gas('prague')
    expect(prague.floorTokenGas).toBe(10n)
    expect(prague.txGasLimitCap).toBeUndefined()
    expect(prague.blob.max).toBe(9)
    expect(prague.blob.maxPerTransaction).toBe(9)
  })

  test('behavior: returns a fresh schedule per call', () => {
    const a = Hardfork.gas('osaka')
    const b = Hardfork.gas('osaka')
    expect(a).not.toBe(b)
    expect(a.blob).not.toBe(b.blob)
  })

  test('error: unknown hardfork', () => {
    expect(() =>
      // @ts-expect-error
      Hardfork.gas('shanghai'),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hardfork.UnknownHardforkError: Unknown hardfork \`shanghai\`.

      Known hardforks: cancun, prague, osaka.]
    `)
  })
})

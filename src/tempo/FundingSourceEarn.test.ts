import { describe, expect, test } from 'vp/test'
import * as FundingSourceEarn from './FundingSourceEarn.js'

const vault = '0x0101010101010101010101010101010101010101' as const
const addressWord =
  '0000000000000000000000000101010101010101010101010101010101010101'
const unlimited =
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
const zero = '0000000000000000000000000000000000000000000000000000000000000000'
const thirty =
  '000000000000000000000000000000000000000000000000000000000000001e'
const fifty = '0000000000000000000000000000000000000000000000000000000000000032'

for (const method of ['encodeConfigData', 'encodeExecutionData'] as const)
  describe(method, () => {
    test('encodes vault, share cap, and underlying value cap in contract order', () => {
      expect(
        FundingSourceEarn[method]({ maxAmountIn: 30n, maxValueIn: 50n, vault }),
      ).toBe(`0x${addressWord}${thirty}${fifty}`)
    })

    test('defaults both caps to unlimited', () => {
      expect(FundingSourceEarn[method]({ vault })).toBe(
        `0x${addressWord}${unlimited}${unlimited}`,
      )
    })

    test('preserves zero and defaults each omitted cap independently', () => {
      expect(FundingSourceEarn[method]({ maxAmountIn: 0n, vault })).toBe(
        `0x${addressWord}${zero}${unlimited}`,
      )
      expect(FundingSourceEarn[method]({ maxValueIn: 0n, vault })).toBe(
        `0x${addressWord}${unlimited}${zero}`,
      )
    })
  })

describe('decodeExecutionData', () => {
  test('decodes an independently encoded contract request', () => {
    expect(
      FundingSourceEarn.decodeExecutionData(
        `0x${addressWord}${thirty}${fifty}`,
      ),
    ).toMatchInlineSnapshot(`
      {
        "maxAmountIn": 30n,
        "maxValueIn": 50n,
        "vault": "0x0101010101010101010101010101010101010101",
      }
    `)
  })
})

describe('decodeConfigData', () => {
  test('decodes configuration bytes', () => {
    expect(
      FundingSourceEarn.decodeConfigData(
        '0x000000000000000000000000010101010101010101010101010101010101010100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002',
      ),
    ).toEqual({ maxAmountIn: 1n, maxValueIn: 2n, vault })
  })
})

describe('behavior', () => {
  test('rejects malformed data', () => {
    expect(() =>
      FundingSourceEarn.decodeExecutionData('0x'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiParameters.ZeroDataError: Cannot decode zero data ("0x") with ABI parameters.]`,
    )
  })

  for (const field of ['maxAmountIn', 'maxValueIn'] as const)
    test(`rejects invalid ${field}`, () => {
      expect(() =>
        FundingSourceEarn.encodeExecutionData({ [field]: -1n, vault }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Hex.IntegerOutOfRangeError: Number \`-1\` is not in safe 256-bit unsigned integer range (\`0\` to \`115792089237316195423570985008687907853269984665640564039457584007913129639935\`)]`,
      )
      expect(() =>
        FundingSourceEarn.encodeConfigData({ [field]: 2n ** 256n, vault }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Hex.IntegerOutOfRangeError: Number \`115792089237316195423570985008687907853269984665640564039457584007913129639936\` is not in safe 256-bit unsigned integer range (\`0\` to \`115792089237316195423570985008687907853269984665640564039457584007913129639935\`)]`,
      )
    })
})

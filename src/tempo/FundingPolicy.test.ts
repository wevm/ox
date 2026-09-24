import { describe, expect, test } from 'vp/test'
import * as FundingPolicy from './FundingPolicy.js'

const token = '0x0101010101010101010101010101010101010101' as const
const target = '0x0202020202020202020202020202020202020202' as const
const requirement = {
  token,
  amount: 50n,
  sources: [{ to: target, data: '0xab' as const }],
  slippageBps: 100,
}

const rules = {
  maxSlippageBps: 100,
  sources: { [token]: requirement.sources },
}
describe('encode', () => {
  test('ABI encodes, decodes and hashes canonical rules', () => {
    expect(FundingPolicy.decode(FundingPolicy.encode(rules))).toEqual(rules)
    expect(FundingPolicy.hash(rules)).toMatch(/^0x[0-9a-f]{64}$/)
    expect(() =>
      FundingPolicy.decode(`${FundingPolicy.encode(rules)}00`),
    ).toThrow()
  })
})

describe('hash', () => {
  test('canonical token order preserves significant source order', () => {
    const second = '0x0303030303030303030303030303030303030303'
    const first = {
      ...rules,
      sources: { [second]: requirement.sources, [token]: requirement.sources },
    }
    const reordered = {
      ...rules,
      sources: { [token]: requirement.sources, [second]: requirement.sources },
    }
    expect(FundingPolicy.encode(first)).toBe(FundingPolicy.encode(reordered))
    const sources = [
      ...requirement.sources,
      { to: target, data: '0xcd' as const },
    ]
    expect(
      FundingPolicy.hash({ ...rules, sources: { [token]: sources } }),
    ).not.toBe(
      FundingPolicy.hash({
        ...rules,
        sources: { [token]: [...sources].reverse() },
      }),
    )
  })
})

describe('toTuple', () => {
  test('rejects invalid policy IDs and admins', () => {
    for (const value of [
      0n,
      2n ** 64n,
      { admins: [], rules },
      { admins: [token, token], rules },
    ])
      expect(() => FundingPolicy.toTuple(value)).toThrow()
  })
})

describe('toRoutes', () => {
  test('maps source addresses to the contract ABI field', () => {
    expect(FundingPolicy.toRoutes(rules)).toEqual([
      { token, sources: [{ target, data: '0xab' }] },
    ])
  })
})

describe('toRpc', () => {
  test('keeps the RPC target field', () => {
    expect(FundingPolicy.toRpc({ admins: [token], rules })).toEqual({
      admins: [token],
      rules: {
        maxSlippageBps: 100,
        sources: { [token]: [{ target, data: '0xab' }] },
      },
    })
  })
})

describe('fromRpc', () => {
  test('maps RPC sources to to', () => {
    expect(
      FundingPolicy.fromRpc({
        admins: [token],
        rules: {
          maxSlippageBps: 100,
          sources: { [token]: [{ target, data: '0xab' }] },
        },
      }),
    ).toEqual({ admins: [token], rules })
  })
})

describe('fromTuple', () => {
  test('decodes source addresses as to', () => {
    expect(
      FundingPolicy.fromTuple([
        [token],
        ['0x64', [[token, [[target, '0xab']]]]],
      ]),
    ).toEqual({ admins: [token], rules })
  })
})

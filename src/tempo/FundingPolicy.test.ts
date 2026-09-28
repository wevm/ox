import { describe, expect, test } from 'vitest'
import * as Rlp from '../core/Rlp.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as KeyAuthorization from './KeyAuthorization.js'

const token = '0x0101010101010101010101010101010101010101' as const
const target = '0x0202020202020202020202020202020202020202' as const
const requirement = {
  token,
  amount: 50n,
  sources: [{ target, data: '0xab' as const }],
  slippageBps: 100,
}

const rules = {
  enforceOrder: false,
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
    const sources = [...requirement.sources, { target, data: '0xcd' as const }]
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
        enforceOrder: false,
        maxSlippageBps: 100,
        sources: { [token]: [{ target, data: '0xab' }] },
      },
    })
  })
})

describe('fromRpc', () => {
  test('preserves RPC source targets', () => {
    expect(
      FundingPolicy.fromRpc({
        admins: [token],
        rules: {
          enforceOrder: false,
          maxSlippageBps: 100,
          sources: { [token]: [{ target, data: '0xab' }] },
        },
      }),
    ).toEqual({ admins: [token], rules })
  })
})

describe('fromTuple', () => {
  test('decodes source targets', () => {
    expect(
      FundingPolicy.fromTuple([
        [token],
        ['0x64', [[token, [[target, '0xab']]]], '0x'],
      ]),
    ).toEqual({ admins: [token], rules })
  })
})

describe('behavior', () => {
  test.each([undefined, false, true])(
    'round-trips ordering (%s)',
    (enforceOrder) => {
      const policy = { admins: [token], rules: { ...rules, enforceOrder } }
      const expected = {
        ...policy,
        rules: { ...policy.rules, enforceOrder: enforceOrder ?? false },
      }
      expect(FundingPolicy.decode(FundingPolicy.encode(policy.rules))).toEqual(
        expected.rules,
      )
      expect(FundingPolicy.fromTuple(FundingPolicy.toTuple(policy))).toEqual(
        expected,
      )
      expect(FundingPolicy.fromRpc(FundingPolicy.toRpc(policy))).toEqual(policy)
      const authorization = {
        address: target,
        chainId: 1n,
        fundingPolicy: policy,
        type: 'secp256k1' as const,
      }
      expect(
        KeyAuthorization.deserialize(KeyAuthorization.serialize(authorization)),
      ).toEqual({
        ...authorization,
        fundingPolicy: expected,
      })
    },
  )

  test('omitted ordering encodes identically to false', () => {
    const { enforceOrder: _, ...unordered } = rules
    expect(FundingPolicy.encode(unordered)).toBe(FundingPolicy.encode(rules))
    expect(FundingPolicy.hash(unordered)).toBe(FundingPolicy.hash(rules))
    expect(
      FundingPolicy.toTuple({ admins: [token], rules: unordered }),
    ).toEqual(FundingPolicy.toTuple({ admins: [token], rules }))
  })

  test('ordering changes the commitment and authorization signature', () => {
    const ordered = { ...rules, enforceOrder: true }
    expect(FundingPolicy.hash(ordered)).not.toBe(FundingPolicy.hash(rules))
    const authorization = {
      address: target,
      chainId: 1n,
      fundingPolicy: { admins: [token], rules },
      type: 'secp256k1' as const,
    }
    expect(KeyAuthorization.getSignPayload(authorization)).not.toBe(
      KeyAuthorization.getSignPayload({
        ...authorization,
        fundingPolicy: { admins: [token], rules: ordered },
      }),
    )
  })

  test('uses the canonical rules wire layout', () => {
    for (const enforceOrder of [false, true]) {
      const empty = { enforceOrder, maxSlippageBps: 0, sources: {} }
      const abi = `0x${[
        '20', // Dynamic tuple offset.
        '00', // Slippage.
        '60', // Routes offset within the tuple.
        enforceOrder ? '01' : '00',
        '00', // Empty routes.
      ]
        .map((word) => word.padStart(64, '0'))
        .join('')}`
      expect(FundingPolicy.encode(empty)).toBe(abi)
      const tuple = FundingPolicy.toTuple({ admins: [token], rules: empty })
      if (typeof tuple === 'string')
        throw new Error('Expected an inline policy.')
      expect(Rlp.fromHex(tuple[1])).toBe(
        enforceOrder ? '0xc380c001' : '0xc380c080',
      )
    }
  })

  test('rejects invalid and missing ordering flags', () => {
    for (const enforceOrder of [0, 1, 'false', null])
      expect(() =>
        FundingPolicy.encode({ ...rules, enforceOrder } as never),
      ).toThrowErrorMatchingInlineSnapshot(
        `[FundingPolicy.InvalidPolicyError: Ordering enforcement must be a boolean.]`,
      )
    for (const suffix of [[], ['0x00'], ['0x02'], ['0x0001']])
      expect(() =>
        FundingPolicy.fromTuple([[token], ['0x', [], ...suffix]] as never),
      ).toThrow()
  })
})

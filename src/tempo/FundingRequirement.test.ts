import { describe, expect, test } from 'vitest'
import type * as Hex from '../core/Hex.js'
import * as Rlp from '../core/Rlp.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as FundingRequirement from './FundingRequirement.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as TransactionRequest from './TransactionRequest.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const token = '0x0101010101010101010101010101010101010101' as const
const target = '0x0202020202020202020202020202020202020202' as const
const requirement = {
  token,
  amount: 50n,
  sources: [{ target, data: '0xab' as const }],
  slippageBps: 100,
}
const envelope = TxEnvelopeTempo.from({
  chainId: 1,
  calls: [{ to: token }],
  requireFunds: [requirement],
})

describe('toTuple', () => {
  test('matches the Rust requirement golden vector', () => {
    // tempo 4926397: funding::funding_requirement_golden.
    expect(Rlp.fromHex(FundingRequirement.toTuple(requirement))).toBe(
      '0xf194010101010101010101010101010101010101010132d8d794020202020202020202020202020202020202020281abc164',
    )
  })

  test('distinguishes omitted and explicit zero slippage', () => {
    expect(
      FundingRequirement.toTuple({ ...requirement, slippageBps: undefined })[3],
    ).toEqual([])
    expect(
      FundingRequirement.toTuple({ ...requirement, slippageBps: 0 })[3],
    ).toEqual(['0x'])
  })
})

describe('toRpc', () => {
  test('preserves source targets', () => {
    expect(FundingRequirement.toRpc(requirement).sources).toEqual([
      { target, data: '0xab' },
    ])
  })

  test('rejects unsafe numeric RPC inputs', () => {
    expect(() =>
      FundingRequirement.toRpc({
        ...requirement,
        amount: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow()
    expect(() => FundingPolicy.toRpc(Number.MAX_SAFE_INTEGER + 1)).toThrow()
  })
})

describe('fromTuple', () => {
  test('rejects malformed tuples and noncanonical quantities', () => {
    for (const tuple of [
      [token, '0x0032', [], []],
      [token, '0x32', [], ['0x00']],
      [token, '0x32', [], ['0x', '0x']],
      [token, '0x32', [[target]], []],
      [token, '0x32', [], [], '0x'],
      [token, '0x32', [], [], '0xab', '0xcd'],
    ])
      expect(() => FundingRequirement.fromTuple(tuple as never)).toThrow()
  })
})

describe('assert', () => {
  test('accepts uint256 maximum and rejects overflow', () => {
    const value = { ...requirement, amount: 2n ** 256n - 1n }
    expect(
      FundingRequirement.fromTuple(FundingRequirement.toTuple(value)),
    ).toEqual(value)
    expect(() =>
      FundingRequirement.toTuple({ ...value, amount: 2n ** 256n }),
    ).toThrow()
  })
})

describe('from', () => {
  test('default', () => {
    expect(
      FundingRequirement.from({ token, amount: 50n, sources: [] }),
    ).toEqual({
      token,
      amount: 50n,
      sources: [],
    })
  })

  test('preserves optional fields and source order', () => {
    const value = {
      ...requirement,
      policyRules: '0xab' as const,
      slippageBps: 0,
    }
    expect(FundingRequirement.from(value)).toEqual(value)
  })

  test('rejects invalid requirements', () => {
    expect(() =>
      FundingRequirement.from({ ...requirement, amount: -1n }),
    ).toThrow(FundingRequirement.InvalidRequirementError)
    expect(() =>
      FundingRequirement.from({ ...requirement, slippageBps: 10001 }),
    ).toThrow(FundingRequirement.InvalidRequirementError)
  })
})

describe('fromRpc', () => {
  test('decodes source targets', () => {
    expect(
      FundingRequirement.fromRpc({
        token,
        amount: '0x32',
        sources: [{ target, data: '0xab' }],
      }),
    ).toEqual({ token, amount: 50n, sources: [{ target, data: '0xab' }] })
  })
})

describe('behavior', () => {
  test('rejects unresolved sources before signing', () => {
    expect(() =>
      FundingRequirement.assert({
        amount: 1n,
        token: '0x20c0000000000000000000000000000000000000',
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[FundingRequirement.InvalidRequirementError: Funding sources must be resolved before signing.]`,
    )
  })

  test('rejects unresolved policy before signing', () => {
    expect(() =>
      KeyAuthorization.getSignPayload({
        address: '0x1111111111111111111111111111111111111111',
        chainId: 1n,
        fundingPolicy: true as never,
        type: 'secp256k1',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[FundingPolicy.InvalidPolicyError: Funding policy must be resolved before signing.]`,
    )
  })

  const rules = {
    maxSlippageBps: 100,
    sources: {
      [token]: requirement.sources,
    },
  }

  test('every funding field is covered by sender and sponsor signatures', () => {
    for (const changed of [
      { ...requirement, token: target },
      { ...requirement, amount: 51n },
      { ...requirement, slippageBps: 0 },
      { ...requirement, policyRules: '0xab' as const },
      { ...requirement, sources: [{ target: token, data: '0xab' as const }] },
      { ...requirement, sources: [{ target, data: '0xcd' as const }] },
    ]) {
      const altered = { ...envelope, requireFunds: [changed] }
      expect(TxEnvelopeTempo.getSignPayload(altered)).not.toBe(
        TxEnvelopeTempo.getSignPayload(envelope),
      )
      expect(
        TxEnvelopeTempo.getFeePayerSignPayload(altered, { sender: token }),
      ).not.toBe(
        TxEnvelopeTempo.getFeePayerSignPayload(envelope, { sender: token }),
      )
    }
  })

  test('round-trips and preserves legacy bytes for omitted and empty arrays', () => {
    expect(
      TxEnvelopeTempo.deserialize(TxEnvelopeTempo.serialize(envelope))
        .requireFunds,
    ).toEqual([requirement])
    expect(TxEnvelopeTempo.serialize({ ...envelope, requireFunds: [] })).toBe(
      TxEnvelopeTempo.serialize({ ...envelope, requireFunds: undefined }),
    )
    const rpc = TransactionRequest.toRpc(envelope)
    expect(rpc.requireFunds !== true && rpc.requireFunds?.[0]?.amount).toBe(
      '0x32',
    )
    expect(TransactionRequest.fromRpc(rpc).requireFunds).toEqual([requirement])
  })

  test('commits funding to the sender signature', () => {
    expect(TxEnvelopeTempo.getSignPayload(envelope)).not.toBe(
      TxEnvelopeTempo.getSignPayload({
        ...envelope,
        requireFunds: [{ ...requirement, amount: 51n }],
      }),
    )
  })

  test('rejects invalid values and malformed extensions', () => {
    expect(() =>
      FundingRequirement.toTuple({ ...requirement, amount: -1n }),
    ).toThrow()
    expect(() =>
      FundingRequirement.toTuple({ ...requirement, slippageBps: 10_001 }),
    ).toThrow()
    expect(() =>
      FundingRequirement.toTuple({ ...requirement, policyRules: '0x' }),
    ).toThrow()
    const raw = Rlp.toHex(
      TxEnvelopeTempo.serialize(envelope).replace(
        /^0x76/,
        '0x',
      ) as `0x${string}`,
    ) as readonly unknown[]
    expect(() =>
      TxEnvelopeTempo.deserialize(
        `0x76${Rlp.fromHex([...raw.slice(0, 14), []] as never).slice(2)}`,
      ),
    ).toThrow()
  })

  test('rejects a stray authorization placeholder and trailing fields', () => {
    const base = Rlp.toHex(
      TxEnvelopeTempo.serialize({
        ...envelope,
        requireFunds: undefined,
      }).replace(/^0x76/, '0x') as `0x${string}`,
    ) as readonly Hex.Hex[]
    for (const trailing of [
      ['0x'],
      ['0x', []],
      ['0x', [FundingRequirement.toTuple(requirement)], [], '0x'],
    ])
      expect(() =>
        TxEnvelopeTempo.deserialize(
          `0x76${Rlp.fromHex([...base, ...trailing] as never).slice(2)}`,
        ),
      ).toThrow()
  })

  test('extends key authorization with policy ID and inline rules', () => {
    for (const fundingPolicy of [7n, { admins: [token], rules }]) {
      const authorization = {
        address: target,
        chainId: 1n,
        type: 'secp256k1' as const,
        fundingPolicy,
      }
      expect(
        KeyAuthorization.deserialize(KeyAuthorization.serialize(authorization)),
      ).toEqual(authorization)
    }
  })

  test('matches independent Rust key authorization vector', () => {
    // tempo 4926397: funding_policy::policy_reference_has_canonical_trailing_encoding.
    const authorization = {
      address: '0x1111111111111111111111111111111111111111' as const,
      chainId: 1n,
      type: 'secp256k1' as const,
      fundingPolicy: 7n,
    }
    expect(Rlp.fromHex(KeyAuthorization.toTuple(authorization)[0])).toBe(
      '0xde018094111111111111111111111111111111111111111180808080808007',
    )
  })
})

describe('unsigned intent', () => {
  const intents = [
    {},
    { token },
    { amount: 0n, sources: [] },
    { sources: [{ target, data: '0xab' as const }], slippageBps: 0 },
  ] as const

  test('round-trips omitted fields, zero amounts, and explicit empty sources', () => {
    const rpc = intents.map(FundingRequirement.toRpcRequest)
    expect(rpc).toEqual([
      {},
      { token },
      { amount: '0x0', sources: [] },
      { sources: [{ target, data: '0xab' }], slippageBps: '0x0' },
    ])
    expect(rpc.map(FundingRequirement.fromRpcRequest)).toEqual(intents)
  })

  test.each([true, [], intents] as const)(
    'round-trips transaction intent (%s)',
    (requireFunds) => {
      const rpc = TransactionRequest.toRpc({ requireFunds })
      expect(rpc.type).toBe('0x76')
      expect(TransactionRequest.fromRpc(rpc).requireFunds).toEqual(requireFunds)
    },
  )

  test('keeps resolved RPC and signed codecs strict', () => {
    for (const intent of intents) {
      expect(() => FundingRequirement.toTuple(intent as never)).toThrow()
      expect(() => FundingRequirement.toRpc(intent as never)).toThrow()
      expect(() =>
        FundingRequirement.fromRpc(
          FundingRequirement.toRpcRequest(intent) as never,
        ),
      ).toThrow()
      expect(() =>
        TxEnvelopeTempo.serialize({
          ...envelope,
          requireFunds: [intent],
        } as never),
      ).toThrow()
    }
    expect(() =>
      TxEnvelopeTempo.serialize({ ...envelope, requireFunds: true } as never),
    ).toThrow()
  })

  test.each([
    { token: '0x1234' },
    { amount: -1n },
    { amount: 2n ** 256n },
    { amount: Number.MAX_SAFE_INTEGER + 1 },
    { slippageBps: 10_001 },
    { policyRules: '0x' },
    { sources: [{ target, data: '0x1' }] },
    { sources: null },
  ])('rejects invalid supplied fields (%s)', (intent) => {
    expect(() =>
      TransactionRequest.toRpc({ requireFunds: [intent] } as never),
    ).toThrow()
  })
})

import { describe, expect, test } from 'vp/test'
import type * as Hex from '../core/Hex.js'
import * as Rlp from '../core/Rlp.js'
import * as Funding from './Funding.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as NativeDexFunding from './NativeDexFunding.js'
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

describe('funding transaction codecs', () => {
  test('matches the Rust requirement golden vector', () => {
    // tempo 4926397: funding::funding_requirement_golden.
    expect(Rlp.fromHex(Funding.toTuple(requirement))).toBe(
      '0xf194010101010101010101010101010101010101010132d8d794020202020202020202020202020202020202020281abc164',
    )
  })
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
    expect(rpc.requireFunds?.[0]?.amount).toBe('0x32')
    expect(TransactionRequest.fromRpc(rpc).requireFunds).toEqual([requirement])
  })
  test('distinguishes omitted and explicit zero slippage', () => {
    expect(
      Funding.toTuple({ ...requirement, slippageBps: undefined })[3],
    ).toEqual([])
    expect(Funding.toTuple({ ...requirement, slippageBps: 0 })[3]).toEqual([
      '0x',
    ])
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
    expect(() => Funding.toTuple({ ...requirement, amount: -1n })).toThrow()
    expect(() =>
      Funding.toTuple({ ...requirement, slippageBps: 10_001 }),
    ).toThrow()
    expect(() =>
      Funding.toTuple({ ...requirement, policyRules: '0x' }),
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
})

describe('malformed funding encodings', () => {
  test('rejects unsafe numeric RPC inputs', () => {
    expect(() =>
      Funding.toRpc({ ...requirement, amount: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow()
    expect(() => FundingPolicy.toRpc(Number.MAX_SAFE_INTEGER + 1)).toThrow()
  })

  test('rejects malformed tuples and noncanonical quantities', () => {
    for (const tuple of [
      [token, '0x0032', [], []],
      [token, '0x32', [], ['0x00']],
      [token, '0x32', [], ['0x', '0x']],
      [token, '0x32', [[target]], []],
      [token, '0x32', [], [], '0x'],
      [token, '0x32', [], [], '0xab', '0xcd'],
    ])
      expect(() => Funding.fromTuple(tuple as never)).toThrow()
  })
  test('accepts uint256 maximum and rejects overflow', () => {
    const value = { ...requirement, amount: 2n ** 256n - 1n }
    expect(Funding.fromTuple(Funding.toTuple(value))).toEqual(value)
    expect(() => Funding.toTuple({ ...value, amount: 2n ** 256n })).toThrow()
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
      ['0x', [Funding.toTuple(requirement)], [], '0x'],
    ])
      expect(() =>
        TxEnvelopeTempo.deserialize(
          `0x76${Rlp.fromHex([...base, ...trailing] as never).slice(2)}`,
        ),
      ).toThrow()
  })
})

describe('policy codecs', () => {
  const rules = {
    maxSlippageBps: 100,
    sources: { [token]: requirement.sources },
  }
  test('ABI encodes, decodes and hashes canonical rules', () => {
    expect(FundingPolicy.decode(FundingPolicy.encode(rules))).toEqual(rules)
    expect(FundingPolicy.hash(rules)).toMatch(/^0x[0-9a-f]{64}$/)
    expect(() =>
      FundingPolicy.decode(`${FundingPolicy.encode(rules)}00`),
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

describe('native DEX payload', () => {
  test('preserves zero and defaults to unlimited input', () => {
    expect(
      NativeDexFunding.decode(NativeDexFunding.encode({ tokenIn: token })),
    ).toEqual({ tokenIn: token, maxAmountIn: 2n ** 256n - 1n })
    expect(
      NativeDexFunding.decode(
        NativeDexFunding.encode({ tokenIn: token, maxAmountIn: 0n }),
      ),
    ).toEqual({ tokenIn: token, maxAmountIn: 0n })
  })
})

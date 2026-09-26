import * as z from 'zod/mini'
import { describe, expect, test } from 'vp/test'
import * as FundingRequirement from '../FundingRequirement.js'
import * as FundingPolicy from '../FundingPolicy.js'
import * as z_KeyAuthorization from '../KeyAuthorization.js'
import * as TransactionRequest from '../TransactionRequest.js'
import * as TxEnvelopeTempo from '../TxEnvelopeTempo.js'

const token = '0x0101010101010101010101010101010101010101' as const
const requirement = {
  token,
  amount: 50n,
  slippageBps: 0,
  sources: [{ to: token, data: '0xab' as const }],
}

describe('behavior', () => {
  test('funding RPC and request codecs retain all fields', () => {
    const rpc = z.encode(FundingRequirement.FundingRequirement, requirement)
    expect(rpc.amount).toBe('0x32')
    expect(rpc.slippageBps).toBe('0x0')
    expect(z.decode(FundingRequirement.FundingRequirement, rpc)).toEqual(
      requirement,
    )
    const request = z.encode(TransactionRequest.TransactionRequest, {
      requireFunds: [requirement],
    })
    expect(request.type).toBe('0x76')
    expect(
      z.decode(TransactionRequest.TransactionRequest, request).requireFunds,
    ).toEqual([requirement])
  })

  test('envelope schema preserves funding and rejects invalid slippage', () => {
    const envelope = {
      type: 'tempo' as const,
      chainId: 1,
      calls: [{ to: token }],
      requireFunds: [requirement],
    }
    expect(
      z.parse(TxEnvelopeTempo.TxEnvelopeTempo, envelope).requireFunds,
    ).toEqual([requirement])
    expect(
      z.safeParse(FundingRequirement.Domain, {
        ...requirement,
        slippageBps: 10001,
      }).success,
    ).toBe(false)
  })

  test('key schema preserves existing and inline policies', () => {
    for (const fundingPolicy of [
      7n,
      {
        admins: [token],
        rules: {
          maxSlippageBps: 100,
          sources: {
            [token]: requirement.sources,
          },
        },
      },
    ]) {
      const value = {
        address: token,
        chainId: 1n,
        type: 'secp256k1' as const,
        fundingPolicy,
        signature: {
          type: 'secp256k1' as const,
          signature: {
            r: `0x${'01'.repeat(32)}` as const,
            s: `0x${'02'.repeat(32)}` as const,
            yParity: 0 as const,
          },
        },
      }
      const encoded = z.encode(z_KeyAuthorization.KeyAuthorization, value)
      expect(
        z.decode(z_KeyAuthorization.KeyAuthorization, encoded).fundingPolicy,
      ).toEqual(fundingPolicy)
    }
    expect(z.safeParse(FundingPolicy.Authorization, 0n).success).toBe(false)
  })
})

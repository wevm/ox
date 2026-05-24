import { Hash, Hex, TypedData } from 'ox'
import { Channel } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const descriptor = {
  authorizedSigner: '0x3333333333333333333333333333333333333333',
  chainId: 4217,
  expiringNonceHash:
    '0x0000000000000000000000000000000000000000000000000000000000000002',
  operator: '0x0000000000000000000000000000000000000000',
  payee: '0x2222222222222222222222222222222222222222',
  payer: '0x1111111111111111111111111111111111111111',
  salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
  token: 1n,
} as const

describe('address', () => {
  test('default', () => {
    expect(Channel.address).toMatchInlineSnapshot(
      `"0x4d50500000000000000000000000000000000000"`,
    )
  })
})

describe('closeGracePeriod', () => {
  test('default', () => {
    expect(Channel.closeGracePeriod).toMatchInlineSnapshot(`900n`)
  })
})

describe('voucherTypehash', () => {
  test('default', () => {
    expect(Channel.voucherTypehash).toBe(
      Hash.keccak256(
        Hex.fromString('Voucher(bytes32 channelId,uint96 cumulativeAmount)'),
      ),
    )
    expect(Channel.voucherTypehash).toMatchInlineSnapshot(
      `"0x4730b4b2fe8de522475e80e010877c5b58ad10eb07fd0436615ee123f743bbe8"`,
    )
  })
})

describe('computeId', () => {
  test('default', () => {
    expect(Channel.computeId(descriptor)).toMatchInlineSnapshot(
      `"0xa392474fdbb5c6753e8789236893343f11200f43ba53cca09c0cda3651946ef2"`,
    )
  })

  test('address inputs', () => {
    expect(
      Channel.computeId({
        ...descriptor,
        payee: 'tempox0x2222222222222222222222222222222222222222',
        token: 'tempox0x20c0000000000000000000000000000000000001',
      }),
    ).toBe(Channel.computeId(descriptor))
  })

  test('chain id bigint', () => {
    expect(Channel.computeId({ ...descriptor, chainId: 4217n })).toBe(
      Channel.computeId(descriptor),
    )
  })
})

describe('domainSeparator', () => {
  test('default', () => {
    const separator = Channel.domainSeparator({ chainId: descriptor.chainId })

    expect(separator).toBe(
      TypedData.domainSeparator({
        name: 'TIP20 Channel Reserve',
        version: '1',
        chainId: descriptor.chainId,
        verifyingContract: Channel.address,
      }),
    )
    expect(separator).toMatchInlineSnapshot(
      `"0x6465ffa0b0c1e7cfc1a894ba54d79615bc06fd7cc9cfec558f3df82189d17367"`,
    )
  })
})

describe('getVoucherSignPayload', () => {
  test('default', () => {
    const channelId = Channel.computeId(descriptor)
    const cumulativeAmount = 100n
    const payload = Channel.getVoucherSignPayload({
      chainId: descriptor.chainId,
      channelId,
      cumulativeAmount,
    })

    expect(payload).toBe(
      TypedData.getSignPayload({
        domain: {
          name: 'TIP20 Channel Reserve',
          version: '1',
          chainId: descriptor.chainId,
          verifyingContract: Channel.address,
        },
        message: {
          channelId,
          cumulativeAmount,
        },
        primaryType: 'Voucher',
        types: {
          Voucher: [
            { name: 'channelId', type: 'bytes32' },
            { name: 'cumulativeAmount', type: 'uint96' },
          ],
        },
      }),
    )
    expect(payload).toMatchInlineSnapshot(
      `"0x22bb33a0c0d3e04c9312dd8c70c80154e953fef495dd76ffa14388a9c7f987d3"`,
    )
  })
})

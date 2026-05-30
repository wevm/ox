import { AbiEvent, AbiParameters } from 'ox'
import { ReceivePolicyReceipt } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const token = '0x20c0000000000000000000000000000000000001'
const originator = '0x0000000000000000000000000000000000000aaa'
const recipient = '0x0000000000000000000000000000000000000bbb'
const zeroAddress = '0x0000000000000000000000000000000000000000'
const zeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const witnessParameters = [
  {
    type: 'tuple',
    components: [
      { name: 'version', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'recoveryAuthority', type: 'address' },
      { name: 'originator', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'blockedAt', type: 'uint64' },
      { name: 'blockedNonce', type: 'uint64' },
      { name: 'blockedReason', type: 'uint8' },
      { name: 'kind', type: 'uint8' },
      { name: 'memo', type: 'bytes32' },
    ],
  },
] as const

function encodeWitness(
  overrides: Partial<{
    blockedReason: number
    kind: number
  }> = {},
) {
  return AbiParameters.encode(witnessParameters, [
    {
      version: 1,
      token,
      recoveryAuthority: zeroAddress,
      originator,
      recipient,
      blockedAt: 1234n,
      blockedNonce: 5n,
      blockedReason: overrides.blockedReason ?? 2,
      kind: overrides.kind ?? 0,
      memo: zeroHash,
    },
  ])
}

const transferBlocked = AbiEvent.from(
  'event TransferBlocked(address indexed token, address indexed receiver, uint64 indexed blockedNonce, uint256 amount, uint8 receiptVersion, bytes receipt)',
)

function blockedLog(witness: `0x${string}`) {
  const { topics } = AbiEvent.encode(transferBlocked, {
    token,
    receiver: recipient,
    blockedNonce: 5n,
  })
  const data = AbiParameters.encode(
    [{ type: 'uint256' }, { type: 'uint8' }, { type: 'bytes' }],
    [10_000_000n, 1, witness],
  )
  return { data, topics: topics as readonly `0x${string}`[] }
}

describe('decode', () => {
  test('default', () => {
    expect(ReceivePolicyReceipt.decode(encodeWitness())).toMatchInlineSnapshot(`
      {
        "blockedAt": 1234n,
        "blockedNonce": 5n,
        "blockedReason": "receivePolicy",
        "kind": "transfer",
        "memo": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "originator": "0x0000000000000000000000000000000000000aaa",
        "recipient": "0x0000000000000000000000000000000000000bbb",
        "recoveryAuthority": "0x0000000000000000000000000000000000000000",
        "token": "0x20c0000000000000000000000000000000000001",
        "version": 1,
      }
    `)
  })

  test('behavior: kind mint', () => {
    expect(ReceivePolicyReceipt.decode(encodeWitness({ kind: 1 })).kind).toBe(
      'mint',
    )
  })

  test('behavior: blocked reason token filter', () => {
    expect(
      ReceivePolicyReceipt.decode(encodeWitness({ blockedReason: 1 }))
        .blockedReason,
    ).toBe('tokenFilter')
  })
})

describe('from', () => {
  test('from encoded witness', () => {
    expect(ReceivePolicyReceipt.from(encodeWitness())).toEqual(
      ReceivePolicyReceipt.decode(encodeWitness()),
    )
  })

  test('passthrough decoded receipt', () => {
    const receipt = ReceivePolicyReceipt.decode(encodeWitness())
    expect(ReceivePolicyReceipt.from(receipt)).toBe(receipt)
  })
})

describe('fromTransactionReceipt', () => {
  test('single blocked transfer', () => {
    const receipts = ReceivePolicyReceipt.fromTransactionReceipt({
      logs: [blockedLog(encodeWitness())],
    })
    expect(receipts).toHaveLength(1)
    expect(receipts[0]).toEqual(ReceivePolicyReceipt.decode(encodeWitness()))
  })

  test('multiple blocked transfers', () => {
    const receipts = ReceivePolicyReceipt.fromTransactionReceipt({
      logs: [
        blockedLog(encodeWitness()),
        blockedLog(encodeWitness({ kind: 1 })),
      ],
    })
    expect(receipts).toHaveLength(2)
    expect(receipts[0]!.kind).toBe('transfer')
    expect(receipts[1]!.kind).toBe('mint')
  })

  test('ignores unrelated logs', () => {
    const receipts = ReceivePolicyReceipt.fromTransactionReceipt({
      logs: [
        {
          data: '0x',
          topics: [zeroHash],
        },
        blockedLog(encodeWitness()),
      ],
    })
    expect(receipts).toHaveLength(1)
  })

  test('behavior: no logs', () => {
    expect(ReceivePolicyReceipt.fromTransactionReceipt({})).toEqual([])
    expect(ReceivePolicyReceipt.fromTransactionReceipt({ logs: [] })).toEqual(
      [],
    )
  })
})

test('exports', () => {
  expect(Object.keys(ReceivePolicyReceipt)).toMatchInlineSnapshot(`
    [
      "decode",
      "from",
      "fromTransactionReceipt",
    ]
  `)
})

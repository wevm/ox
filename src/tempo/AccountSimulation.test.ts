import { AccountConfig, AccountSimulation } from 'ox/tempo'
import { describe, expect, test } from 'vp/test'

const config =
  '0xf852a011111111111111111111111111111111111111111111111111111111111111118002eed694111111111111111111111111111111111111111101d694bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb01' as const
const rpc = {
  approvals: [
    {
      keyType: 'webAuthn',
      keyData: '0x0102030405',
      owner: '0x1111111111111111111111111111111111111111',
    },
  ],
  config,
} as const satisfies AccountSimulation.Rpc

describe('fromRpc', () => {
  test('behavior: decodes the configuration', () => {
    expect(AccountSimulation.fromRpc(rpc)).toMatchInlineSnapshot(`
      {
        "approvals": [
          {
            "keyData": "0x0102030405",
            "keyType": "webAuthn",
            "owner": "0x1111111111111111111111111111111111111111",
          },
        ],
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "weight": 1,
            },
          ],
          "salt": "0x1111111111111111111111111111111111111111111111111111111111111111",
          "threshold": 2,
          "version": 0n,
        },
      }
    `)
  })

  test('behavior: preserves the maximum uint64 configuration version', () => {
    const config =
      '0xf843a0000000000000000000000000000000000000000000000000000000000000000088ffffffffffffffff01d7d694111111111111111111111111111111111111111101' as const

    expect(
      AccountSimulation.fromRpc({ ...rpc, approvals: [], config }).config
        .version,
    ).toMatchInlineSnapshot(`18446744073709551615n`)
  })

  test('error: rejects excess root approvals', () => {
    expect(() =>
      AccountSimulation.fromRpc({
        ...rpc,
        approvals: Array.from({ length: 9 }, () => rpc.approvals[0]),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: approval count exceeds 8.]`,
    )
  })
  test('error: rejects nested approvals', () => {
    expect(() =>
      AccountSimulation.fromRpc({
        ...rpc,
        approvals: [{ type: 'configurable', spec: rpc }],
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: only untagged primitive owner approvals are allowed.]`,
    )
  })

  test('error: rejects trailing configuration bytes', () => {
    expect(() =>
      AccountSimulation.fromRpc({ ...rpc, config: `${config}00` }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Rlp.TrailingBytesError: RLP payload encodes a single item, but \`1\` trailing byte remains.]`,
    )
  })

  test('error: rejects malformed configuration RLP', () => {
    expect(() =>
      AccountSimulation.fromRpc({ ...rpc, config: '0xf8' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Cursor.PositionOutOfBoundsError: Position \`1\` is out of bounds (\`0 < position < 1\`).]`,
    )
  })

  test('error: rejects a non-list configuration', () => {
    expect(() =>
      AccountSimulation.fromRpc({ ...rpc, config: '0x01' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: invalid config encoding.]`,
    )
  })

  test('error: rejects noncanonical configuration integers', () => {
    const noncanonical = config
      .replace('0xf852', '0xf853')
      .replace('118002', '11810002') as `0x${string}`

    expect(() =>
      AccountSimulation.fromRpc({ ...rpc, config: noncanonical }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: invalid config encoding.]`,
    )
  })
})

describe('toRpc', () => {
  test('behavior: encodes configurations and shims long key data', () => {
    expect(AccountSimulation.toRpc(AccountSimulation.fromRpc(rpc)))
      .toMatchInlineSnapshot(`
        {
          "approvals": [
            {
              "keyData": "0x0005",
              "keyType": "webAuthn",
              "owner": "0x1111111111111111111111111111111111111111",
            },
          ],
          "config": "0xf852a011111111111111111111111111111111111111111111111111111111111111118002eed694111111111111111111111111111111111111111101d694bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb01",
        }
      `)
  })

  test('behavior: preserves short key data', () => {
    const spec = AccountSimulation.fromRpc({
      ...rpc,
      approvals: [{ ...rpc.approvals[0], keyData: '0x0102' }],
    })

    expect(AccountSimulation.toRpc(spec).approvals).toMatchInlineSnapshot(`
      [
        {
          "keyData": "0x0102",
          "keyType": "webAuthn",
          "owner": "0x1111111111111111111111111111111111111111",
        },
      ]
    `)
  })

  test('behavior: encodes the maximum uint64 configuration version', () => {
    const spec = AccountSimulation.fromRpc(rpc)

    expect(
      AccountSimulation.toRpc({
        ...spec,
        approvals: [],
        config: AccountConfig.from({
          owners: [
            {
              owner: '0x1111111111111111111111111111111111111111',
              weight: 1,
            },
          ],
          threshold: 1,
          version: AccountConfig.maxVersion,
        }),
      }).config,
    ).toMatchInlineSnapshot(
      `"0xf843a0000000000000000000000000000000000000000000000000000000000000000088ffffffffffffffff01d7d694111111111111111111111111111111111111111101"`,
    )
  })

  test('error: rejects excess root approvals', () => {
    const spec = AccountSimulation.fromRpc(rpc)

    expect(() =>
      AccountSimulation.toRpc({
        ...spec,
        approvals: Array.from({ length: 9 }, () => spec.approvals[0]!),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: approval count exceeds 8.]`,
    )
  })
  test('error: rejects nested approvals', () => {
    expect(() =>
      AccountSimulation.toRpc({
        ...rpc,
        approvals: [{ type: 'configurable', spec: rpc }],
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountSimulation.InvalidSimulationError: Invalid account simulation: only untagged primitive owner approvals are allowed.]`,
    )
  })
})

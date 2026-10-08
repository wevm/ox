import { Hash, Hex, Rlp } from 'ox'
import { AccountConfig } from 'ox/tempo'
import { describe, expect, test } from 'vitest'
import { factory } from '../../test/tempo/configurableAccounts.js'

const owner_1 = '0x1111111111111111111111111111111111111111'
const owner_2 = '0x2222222222222222222222222222222222222222'
const payload = `0x${'42'.repeat(32)}` as const
const config = AccountConfig.from({
  owners: [{ owner: owner_1, weight: 1 }],
  threshold: 1,
})
const account = AccountConfig.getAddress(config, { factory })

describe('from', () => {
  test('behavior: normalizes an initial configuration', () => {
    expect(
      AccountConfig.from({
        owners: [
          { owner: owner_2, weight: 1 },
          { owner: owner_1, weight: 1 },
        ],
        threshold: 2,
      }),
    ).toMatchInlineSnapshot(`
      {
        "owners": [
          {
            "owner": "0x1111111111111111111111111111111111111111",
            "weight": 1,
          },
          {
            "owner": "0x2222222222222222222222222222222222222222",
            "weight": 1,
          },
        ],
        "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "threshold": 2,
        "version": 0n,
      }
    `)
  })

  test('behavior: normalizes a numeric configuration version', () => {
    expect(
      AccountConfig.from({ ...config, version: 1 }),
    ).toMatchInlineSnapshot(`
      {
        "owners": [
          {
            "owner": "0x1111111111111111111111111111111111111111",
            "weight": 1,
          },
        ],
        "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "threshold": 1,
        "version": 1n,
      }
    `)
  })

  test('error: rejects an invalid configuration', () => {
    expect(() =>
      AccountConfig.from({ owners: [], threshold: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: owners cannot be empty.]`,
    )
  })

  test('error: rejects an invalid numeric version', () => {
    expect(() =>
      AccountConfig.from({ ...config, version: 1.5 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: version must be an unsigned 64-bit integer.]`,
    )
  })
})

describe('fromRpc/toRpc', () => {
  test('behavior: round trips a configuration', () => {
    const rpc = AccountConfig.toRpc({ ...config, version: 1n })
    expect(rpc).toMatchInlineSnapshot(`
      {
        "owners": [
          {
            "owner": "0x1111111111111111111111111111111111111111",
            "weight": 1,
          },
        ],
        "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "threshold": 1,
        "version": "0x1",
      }
    `)
    expect(AccountConfig.fromRpc(rpc)).toStrictEqual({
      ...config,
      version: 1n,
    })
  })
})

describe('getAddress', () => {
  test('example: matches the frozen CREATE2 vector', () => {
    expect(account).toMatchInlineSnapshot(
      `"0x90ba71cb7534da990a1182cf28c9bf415055e03d"`,
    )
    expect(account).not.toBe('0x8820d1497eeaf4f68e00b2cfc00a2f3b1dbb00da')
  })

  test('behavior: includes salt, threshold, and owners', () => {
    expect(
      AccountConfig.getAddress(
        {
          owners: [
            { owner: owner_1, weight: 1 },
            { owner: owner_2, weight: 2 },
          ],
          salt: `0x${'42'.repeat(32)}`,
          threshold: 2,
        },
        { factory },
      ),
    ).toMatchInlineSnapshot(`"0x7898a7d1dd96946d2a968de1540ca884a244320c"`)
  })

  test('behavior: is stable and binds the salt', () => {
    expect({
      repeated: AccountConfig.getAddress(config, { factory }),
      salted: AccountConfig.getAddress(
        {
          ...config,
          salt: `0x${'42'.repeat(32)}`,
        },
        { factory },
      ),
    }).toMatchInlineSnapshot(`
      {
        "repeated": "0x90ba71cb7534da990a1182cf28c9bf415055e03d",
        "salted": "0xa1a8472f4a01772db729d8ebc73fe46120750b83",
      }
    `)
  })

  test('error: rejects a current configuration', () => {
    expect(() =>
      AccountConfig.getAddress({ ...config, version: 1n }, { factory }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: account address requires version zero.]`,
    )
  })

  test('behavior: accepts numeric zero for an initial configuration', () => {
    expect(
      AccountConfig.getAddress({ ...config, version: 0 }, { factory }),
    ).toBe(account)
  })
})

describe('getCommitment', () => {
  test('example: matches the frozen initial and current vectors', () => {
    expect({
      current: AccountConfig.getCommitment({ ...config, version: 1n }),
      currentNumber: AccountConfig.getCommitment({ ...config, version: 1 }),
      initial: AccountConfig.getCommitment(config),
    }).toMatchInlineSnapshot(`
      {
        "current": "0x6237ca5930f2265d4fb70a0305dd6ceea4df227053b4a62c304489ede946a2f8",
        "currentNumber": "0x6237ca5930f2265d4fb70a0305dd6ceea4df227053b4a62c304489ede946a2f8",
        "initial": "0xa9e7d1e2ad25e227a4de5f38f3bba31d854ffc8efec46aaa8649097a516bb4ee",
      }
    `)
  })
})

describe('getSignPayload', () => {
  test('example: matches the frozen version-0 vector', () => {
    expect(
      AccountConfig.getSignPayload({ account, config, payload }),
    ).toMatchInlineSnapshot(
      `"0x728efe90611b01c91c2be0da56e7eb8e0d2c274c84f97182e274187dde0b8a20"`,
    )
  })

  test('behavior: binds the configuration version', () => {
    expect(
      AccountConfig.getSignPayload({
        account,
        config: { version: 1 },
        payload,
      }),
    ).not.toBe(AccountConfig.getSignPayload({ account, config, payload }))
  })
})

describe('toTuple/fromTuple', () => {
  test('example: matches the frozen initial and current RLP vectors', () => {
    expect({
      current: Rlp.fromHex(AccountConfig.toTuple({ ...config, version: 1n })),
      initial: Rlp.fromHex(AccountConfig.toTuple(config)),
    }).toMatchInlineSnapshot(`
      {
        "current": "0xf83ba000000000000000000000000000000000000000000000000000000000000000000101d7d694111111111111111111111111111111111111111101",
        "initial": "0xf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d694111111111111111111111111111111111111111101",
      }
    `)
  })

  test('behavior: round trips the complete witness', () => {
    const current = AccountConfig.from({
      owners: [
        { owner: owner_1, weight: 1 },
        { owner: owner_2, weight: 2 },
      ],
      salt: `0x${'42'.repeat(32)}`,
      threshold: 3,
      version: 1n,
    })
    expect(
      AccountConfig.fromTuple(AccountConfig.toTuple(current)),
    ).toStrictEqual(current)
  })
})

describe('update', () => {
  test('default', () => {
    expect(
      AccountConfig.update(config, {
        owners: [
          { owner: owner_2, weight: 1 },
          { owner: owner_1, weight: 1 },
        ],
        threshold: 2,
      }),
    ).toMatchInlineSnapshot(`
      {
        "owners": [
          {
            "owner": "0x1111111111111111111111111111111111111111",
            "weight": 1,
          },
          {
            "owner": "0x2222222222222222222222222222222222222222",
            "weight": 1,
          },
        ],
        "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "threshold": 2,
        "version": 1n,
      }
    `)
  })

  test('behavior: keeps the salt and increments each version', () => {
    const initialConfig = AccountConfig.from({
      owners: [{ owner: owner_1, weight: 1 }],
      salt: `0x${'42'.repeat(32)}`,
      threshold: 1,
    })
    const next = AccountConfig.update(initialConfig, {
      owners: [{ owner: owner_2, weight: 1 }],
      threshold: 1,
    })
    const last = AccountConfig.update(next, {
      owners: [{ owner: owner_1, weight: 1 }],
      threshold: 1,
    })
    expect({
      last: { salt: last.salt, version: last.version },
      next: { salt: next.salt, version: next.version },
    }).toMatchInlineSnapshot(`
      {
        "last": {
          "salt": "0x4242424242424242424242424242424242424242424242424242424242424242",
          "version": 2n,
        },
        "next": {
          "salt": "0x4242424242424242424242424242424242424242424242424242424242424242",
          "version": 1n,
        },
      }
    `)
    expect(AccountConfig.getCommitment(last)).not.toBe(
      AccountConfig.getCommitment(initialConfig),
    )
  })

  test('error: rejects version overflow', () => {
    expect(() =>
      AccountConfig.update(
        { ...config, version: AccountConfig.maxVersion },
        { owners: config.owners, threshold: 1 },
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: version overflow.]`,
    )
  })

  test('error: rejects an invalid replacement', () => {
    expect(() =>
      AccountConfig.update(config, {
        owners: [{ owner: owner_1, weight: 1 }],
        threshold: 2,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: threshold exceeds total owner weight.]`,
    )
  })
})

describe('assert/validate', () => {
  test('example: matches the frozen 48-owner boundary vector', () => {
    const boundary = AccountConfig.from({
      owners: Array.from({ length: 48 }, (_, index) => ({
        owner: `0x${(index + 1).toString(16).padStart(40, '0')}` as const,
        weight: 1,
      })),
      threshold: 8,
    })
    const rlp = Rlp.fromHex(AccountConfig.toTuple(boundary))
    expect({
      account: AccountConfig.getAddress(boundary, { factory }),
      commitment: AccountConfig.getCommitment(boundary),
      rlpHash: Hash.keccak256(rlp),
      rlpLength: Hex.size(rlp),
      valid: AccountConfig.validate(boundary),
    }).toMatchInlineSnapshot(`
      {
        "account": "0x6acb25715a2b0cf05c098f753a87d9b38471e99f",
        "commitment": "0x0dc47a7ab45ffa21a01bfd115427e26617b5a57d7ccbea57db2fd4537ba96f56",
        "rlpHash": "0xbaf0d030add91caaa10815d2e99c942f1e39b0d199216973781adb4fc1af6955",
        "rlpLength": 1145,
        "valid": true,
      }
    `)
  })

  test('behavior: accepts thresholds above eight reachable by eight signatures', () => {
    expect(
      AccountConfig.validate({
        owners: [
          { owner: owner_1, weight: 100 },
          { owner: owner_2, weight: 100 },
        ],
        threshold: 150,
      }),
    ).toBe(true)
    expect(
      AccountConfig.validate({
        owners: [
          { owner: owner_1, weight: 128 },
          { owner: owner_2, weight: 127 },
        ],
        threshold: AccountConfig.maxThreshold,
      }),
    ).toBe(true)
  })

  test('behavior: accepts the uint8 weight boundary', () => {
    expect(
      AccountConfig.validate({
        owners: [
          { owner: owner_1, weight: 128 },
          { owner: owner_2, weight: 127 },
        ],
        threshold: 8,
      }),
    ).toBe(true)
  })

  test.each([
    { config: { owners: [], threshold: 1 }, name: 'empty owners' },
    {
      config: {
        owners: Array.from({ length: 49 }, (_, index) => ({
          owner: `0x${(index + 1).toString(16).padStart(40, '0')}` as const,
          weight: 1,
        })),
        threshold: 1,
      },
      name: '49 owners',
    },
    {
      config: { owners: config.owners, threshold: 0 },
      name: 'zero threshold',
    },
    {
      config: {
        owners: [
          {
            owner: '0x0000000000000000000000000000000000000000' as const,
            weight: 1,
          },
        ],
        threshold: 1,
      },
      name: 'zero owner',
    },
    {
      config: {
        owners: [{ owner: owner_1, weight: 0 }],
        threshold: 1,
      },
      name: 'zero weight',
    },
    {
      config: {
        owners: [
          { owner: owner_1, weight: 1 },
          { owner: owner_1, weight: 1 },
        ],
        threshold: 1,
      },
      name: 'duplicate owner',
    },
    {
      config: {
        owners: [
          { owner: owner_2, weight: 1 },
          { owner: owner_1, weight: 1 },
        ],
        threshold: 1,
      },
      name: 'unsorted owners',
    },
    {
      config: {
        owners: [
          { owner: owner_1, weight: 128 },
          { owner: owner_2, weight: 128 },
        ],
        threshold: 8,
      },
      name: 'weight overflow',
    },
    {
      config: {
        owners: Array.from({ length: 9 }, (_, index) => ({
          owner:
            `0x${(index + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
          weight: 1,
        })),
        threshold: 9,
      },
      name: 'unreachable threshold',
    },
    {
      config: {
        owners: [
          { owner: owner_1, weight: 128 },
          { owner: owner_2, weight: 127 },
        ],
        threshold: AccountConfig.maxThreshold + 1,
      },
      name: 'threshold above max',
    },
    {
      config: { ...config, salt: '0x42' as const },
      name: 'short salt',
    },
    {
      config: { ...config, version: -1n },
      name: 'negative version',
    },
    {
      config: { ...config, version: -1 },
      name: 'negative numeric version',
    },
    {
      config: { ...config, version: AccountConfig.maxVersion + 1n },
      name: 'version overflow',
    },
    {
      config: { ...config, version: 1.5 },
      name: 'fractional numeric version',
    },
    {
      config: { ...config, version: Number.MAX_SAFE_INTEGER + 1 },
      name: 'unsafe numeric version',
    },
  ])('error: rejects $name', ({ config }) => {
    expect(AccountConfig.validate(config as AccountConfig.Input)).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(AccountConfig)).toMatchInlineSnapshot(`
    [
      "maxOwnerSignatureBytes",
      "maxOwners",
      "maxSignatures",
      "maxThreshold",
      "maxVersion",
      "signatureTypeByte",
      "zeroSalt",
      "assert",
      "from",
      "fromRpc",
      "fromTuple",
      "getAddress",
      "getCommitment",
      "getSignPayload",
      "toRpc",
      "toTuple",
      "update",
      "validate",
      "InvalidConfigError",
    ]
  `)
})

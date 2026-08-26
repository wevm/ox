import { Hash, Hex, Rlp } from 'ox'
import { MultisigConfig } from 'ox/tempo'
import { describe, expect, test } from 'vp/test'

const owner_1 = '0x1111111111111111111111111111111111111111'
const owner_2 = '0x2222222222222222222222222222222222222222'
const payload = `0x${'42'.repeat(32)}` as const
const config = MultisigConfig.from({
  owners: [{ owner: owner_1, weight: 1 }],
  threshold: 1,
})
const account = MultisigConfig.getAddress(config)

describe('from', () => {
  test('behavior: normalizes an initial configuration', () => {
    expect(
      MultisigConfig.from({
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
    expect(MultisigConfig.from({ ...config, version: 1 }))
      .toMatchInlineSnapshot(`
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
      MultisigConfig.from({ owners: [], threshold: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigConfig.InvalidConfigError: Invalid native multisig config: owners cannot be empty.]`,
    )
  })

  test('error: rejects an invalid numeric version', () => {
    expect(() =>
      MultisigConfig.from({ ...config, version: 1.5 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigConfig.InvalidConfigError: Invalid native multisig config: version must be an unsigned 64-bit integer.]`,
    )
  })
})

describe('fromRpc/toRpc', () => {
  test('behavior: round trips a configuration', () => {
    const rpc = MultisigConfig.toRpc({ ...config, version: 1n })
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
    expect(MultisigConfig.fromRpc(rpc)).toStrictEqual({
      ...config,
      version: 1n,
    })
  })
})

describe('getAddress', () => {
  test('example: matches the frozen version-0 vector', () => {
    expect(account).toMatchInlineSnapshot(
      `"0x8820d1497eeaf4f68e00b2cfc00a2f3b1dbb00da"`,
    )
  })

  test('behavior: includes salt, threshold, and owners', () => {
    expect(
      MultisigConfig.getAddress({
        owners: [
          { owner: owner_1, weight: 1 },
          { owner: owner_2, weight: 2 },
        ],
        salt: `0x${'42'.repeat(32)}`,
        threshold: 2,
      }),
    ).toMatchInlineSnapshot(`"0x0773e28146400643e42cb28f6659b74e7c0b451d"`)
  })

  test('error: rejects a current configuration', () => {
    expect(() =>
      MultisigConfig.getAddress({ ...config, version: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigConfig.InvalidConfigError: Invalid native multisig config: account address requires version zero.]`,
    )
  })

  test('behavior: accepts numeric zero for an initial configuration', () => {
    expect(MultisigConfig.getAddress({ ...config, version: 0 })).toBe(account)
  })
})

describe('getCommitment', () => {
  test('example: matches the frozen initial and current vectors', () => {
    expect({
      current: MultisigConfig.getCommitment({ ...config, version: 1n }),
      currentNumber: MultisigConfig.getCommitment({ ...config, version: 1 }),
      initial: MultisigConfig.getCommitment(config),
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
      MultisigConfig.getSignPayload({ account, config, payload }),
    ).toMatchInlineSnapshot(
      `"0xbf944a7a752b2cfab0418d5fb4591c5a7ff62976488edce11794d7f35fb34f41"`,
    )
  })

  test('behavior: binds the configuration version', () => {
    expect(
      MultisigConfig.getSignPayload({
        account,
        config: { version: 1 },
        payload,
      }),
    ).not.toBe(MultisigConfig.getSignPayload({ account, config, payload }))
  })
})

describe('toTuple/fromTuple', () => {
  test('example: matches the frozen initial and current RLP vectors', () => {
    expect({
      current: Rlp.fromHex(MultisigConfig.toTuple({ ...config, version: 1n })),
      initial: Rlp.fromHex(MultisigConfig.toTuple(config)),
    }).toMatchInlineSnapshot(`
      {
        "current": "0xf83ba000000000000000000000000000000000000000000000000000000000000000000101d7d694111111111111111111111111111111111111111101",
        "initial": "0xf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d694111111111111111111111111111111111111111101",
      }
    `)
  })

  test('behavior: round trips the complete witness', () => {
    const current = MultisigConfig.from({
      owners: [
        { owner: owner_1, weight: 1 },
        { owner: owner_2, weight: 2 },
      ],
      salt: `0x${'42'.repeat(32)}`,
      threshold: 3,
      version: 1n,
    })
    expect(
      MultisigConfig.fromTuple(MultisigConfig.toTuple(current)),
    ).toStrictEqual(current)
  })
})

describe('assert/validate', () => {
  test('example: matches the frozen 48-owner boundary vector', () => {
    const boundary = MultisigConfig.from({
      owners: Array.from({ length: 48 }, (_, index) => ({
        owner: `0x${(index + 1).toString(16).padStart(40, '0')}` as const,
        weight: 1,
      })),
      threshold: 8,
    })
    const rlp = Rlp.fromHex(MultisigConfig.toTuple(boundary))
    expect({
      account: MultisigConfig.getAddress(boundary),
      commitment: MultisigConfig.getCommitment(boundary),
      rlpHash: Hash.keccak256(rlp),
      rlpLength: Hex.size(rlp),
      valid: MultisigConfig.validate(boundary),
    }).toMatchInlineSnapshot(`
      {
        "account": "0x6c67c57e0eed05341137dbf88e4e7a90dc46ef50",
        "commitment": "0x0dc47a7ab45ffa21a01bfd115427e26617b5a57d7ccbea57db2fd4537ba96f56",
        "rlpHash": "0xbaf0d030add91caaa10815d2e99c942f1e39b0d199216973781adb4fc1af6955",
        "rlpLength": 1145,
        "valid": true,
      }
    `)
  })

  test('behavior: accepts the uint8 weight boundary', () => {
    expect(
      MultisigConfig.validate({
        owners: [
          { owner: owner_1, weight: 128 },
          { owner: owner_2, weight: 127 },
        ],
        threshold: 255,
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
        threshold: 255,
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
      config: { ...config, version: MultisigConfig.maxVersion + 1n },
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
    expect(MultisigConfig.validate(config as MultisigConfig.Input)).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(MultisigConfig)).toMatchInlineSnapshot(`
    [
      "maxNestingDepth",
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
      "validate",
      "InvalidConfigError",
    ]
  `)
})

import { Hash, Hex, Rlp } from 'ox'
import { AccountConfig } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const owner_1 = '0x1111111111111111111111111111111111111111'
const owner_2 = '0x2222222222222222222222222222222222222222'
const payload = `0x${'42'.repeat(32)}` as const
const config = AccountConfig.from({
  owners: [{ owner: owner_1, weight: 1 }],
  threshold: 1,
})
const account = AccountConfig.getAddress(config)

// Vectors from Tempo `crates/primitives/tests/configurable_account.rs`
// (`configurable_account_hashes_follow_vectors_and_documented_layout`).
const tempo = {
  account: '0x91847576f406d0842ad7c1a0c97c22a122e64278',
} as const

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

describe('fromUpgrade', () => {
  const root = '0x3333333333333333333333333333333333333333'

  test('example: derives the migrated config', () => {
    // The root key may also be listed as an owner.
    const config = AccountConfig.fromUpgrade(root, {
      owners: [
        { owner: root, weight: 1 },
        { owner: owner_1, weight: 1 },
      ],
      threshold: 2,
    })
    expect({
      commitment: AccountConfig.getCommitment(config),
      config,
    }).toMatchInlineSnapshot(`
      {
        "commitment": "0xabca6d8f3a14b99ecaef378042e6a2ffa4f231125517e073cfbd3bcd69ac6ea1",
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0x3333333333333333333333333333333333333333",
              "weight": 1,
            },
          ],
          "salt": "0x42b3dad8fa6c40b50e6dbbbdaaace72d6c04250c16c1e263a52355983a30eb56",
          "threshold": 2,
          "version": 1n,
        },
      }
    `)
  })

  test('behavior: binds the salt to the account', () => {
    const options = {
      owners: [{ owner: owner_1, weight: 1 }],
      threshold: 1,
    } as const
    expect(AccountConfig.fromUpgrade(root, options).salt).not.toBe(
      AccountConfig.fromUpgrade(owner_2, options).salt,
    )
  })

  test('error: rejects an invalid account', () => {
    expect(() =>
      AccountConfig.fromUpgrade('0x1234', {
        owners: [{ owner: owner_1, weight: 1 }],
        threshold: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x1234" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)
  })

  test('error: rejects an invalid config', () => {
    expect(() =>
      AccountConfig.fromUpgrade(root, {
        owners: [{ owner: owner_1, weight: 1 }],
        threshold: 2,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: threshold exceeds total owner weight.]`,
    )
  })
})

describe('getAddress', () => {
  test('example: matches the Tempo vectors', () => {
    expect({
      maxOwners: AccountConfig.getAddress({
        owners: Array.from({ length: AccountConfig.maxOwners }, (_, i) => ({
          owner: Hex.padLeft(Hex.fromNumber(i + 1), 20),
          weight: 1,
        })),
        threshold: 8,
      }),
      single: AccountConfig.getAddress(config),
    }).toMatchInlineSnapshot(`
      {
        "maxOwners": "0x9859f0316567499ebcd81d3417c0622999d7179f",
        "single": "0xcbb727e2489c904a905420e794e8275b6150bfe1",
      }
    `)
  })

  test('example: matches the frozen keccak vector', () => {
    expect(account).toMatchInlineSnapshot(
      `"0xcbb727e2489c904a905420e794e8275b6150bfe1"`,
    )
    expect(account).not.toBe('0x8820d1497eeaf4f68e00b2cfc00a2f3b1dbb00da')
  })

  test('behavior: includes salt, threshold, and owners', () => {
    expect(
      AccountConfig.getAddress({
        owners: [
          { owner: owner_1, weight: 1 },
          { owner: owner_2, weight: 2 },
        ],
        salt: `0x${'42'.repeat(32)}`,
        threshold: 2,
      }),
    ).toMatchInlineSnapshot(`"0x870b14ffcb3d1bd52be7cc6e8358a35712fec535"`)
  })

  test('behavior: is stable and binds the salt', () => {
    expect({
      repeated: AccountConfig.getAddress(config),
      salted: AccountConfig.getAddress({
        ...config,
        salt: `0x${'42'.repeat(32)}`,
      }),
    }).toMatchInlineSnapshot(`
      {
        "repeated": "0xcbb727e2489c904a905420e794e8275b6150bfe1",
        "salted": "0xfc6a724c4715d331ec47dc8c1636798956fd3e4d",
      }
    `)
  })

  test('error: rejects a current configuration', () => {
    expect(() =>
      AccountConfig.getAddress({ ...config, version: 1n }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AccountConfig.InvalidConfigError: Invalid account config: account address requires version zero.]`,
    )
  })

  test('behavior: accepts numeric zero for an initial configuration', () => {
    expect(AccountConfig.getAddress({ ...config, version: 0 })).toBe(account)
  })
})

describe('getCommitment', () => {
  test('example: matches the Tempo vectors', () => {
    expect({
      current: AccountConfig.getCommitment({ ...config, version: 1n }),
      initial: AccountConfig.getCommitment(config),
    }).toMatchInlineSnapshot(`
      {
        "current": "0xee570a0f26f17b41cdf0952a04ee01ea23495b0c0a59f9c904b0d60cb76453c3",
        "initial": "0x79cc3a5fcbe18cb8cbbd2b41393750ccf3bbc20533a846755767fa10068ae01d",
      }
    `)
  })

  test('example: matches the frozen initial and current vectors', () => {
    expect({
      current: AccountConfig.getCommitment({ ...config, version: 1n }),
      currentNumber: AccountConfig.getCommitment({ ...config, version: 1 }),
      initial: AccountConfig.getCommitment(config),
    }).toMatchInlineSnapshot(`
      {
        "current": "0xee570a0f26f17b41cdf0952a04ee01ea23495b0c0a59f9c904b0d60cb76453c3",
        "currentNumber": "0xee570a0f26f17b41cdf0952a04ee01ea23495b0c0a59f9c904b0d60cb76453c3",
        "initial": "0x79cc3a5fcbe18cb8cbbd2b41393750ccf3bbc20533a846755767fa10068ae01d",
      }
    `)
  })
})

describe('getSignPayload', () => {
  test('example: matches the Tempo vectors', () => {
    expect({
      current: AccountConfig.getSignPayload({
        account: tempo.account,
        config: { version: 1n },
        payload,
      }),
      initial: AccountConfig.getSignPayload({
        account: tempo.account,
        config,
        payload,
      }),
    }).toMatchInlineSnapshot(`
      {
        "current": "0x285c850cb2803beb10f2f212dac73784a1a03b3991ba79081b24bfa91beb9182",
        "initial": "0xe6fa513b5ab32da6f116443f13191096bce77b4850f4d51f3aa436fa7650c964",
      }
    `)
  })

  test('example: matches the frozen version-0 vector', () => {
    expect(
      AccountConfig.getSignPayload({ account, config, payload }),
    ).toMatchInlineSnapshot(
      `"0x53a60618dd8fd4d01c2c94a4d9dc482dbb7b97115eb448a4590d153b933e549a"`,
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
      account: AccountConfig.getAddress(boundary),
      commitment: AccountConfig.getCommitment(boundary),
      rlpHash: Hash.keccak256(rlp),
      rlpLength: Hex.size(rlp),
      valid: AccountConfig.validate(boundary),
    }).toMatchInlineSnapshot(`
      {
        "account": "0x9859f0316567499ebcd81d3417c0622999d7179f",
        "commitment": "0xa9282ca5b73ac63b7e27f49cafa6ab13bd2aa79fc45267cf27342db73150cd46",
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
      "fromUpgrade",
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

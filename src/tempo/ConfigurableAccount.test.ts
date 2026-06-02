import { ConfigurableAccount } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

// Ground-truth vectors independently computed via `cast keccak` over the exact
// preimages defined by TIP-1061 / the Tempo reference implementation.
const owner1 = '0x1111111111111111111111111111111111111111'
const owner2 = '0x2222222222222222222222222222222222222222'

const singleOwnerConfig = {
  threshold: 1,
  owners: [{ owner: owner1, weight: 1 }],
} as const

describe('from', () => {
  test('sorts owners ascending by address', () => {
    const config = ConfigurableAccount.from({
      threshold: 2,
      owners: [
        { owner: owner2, weight: 1 },
        { owner: owner1, weight: 1 },
      ],
    })
    expect(config.owners.map((o) => o.owner)).toEqual([owner1, owner2])
  })

  test('asserts validity', () => {
    expect(() =>
      ConfigurableAccount.from({ threshold: 0, owners: [] }),
    ).toThrowError()
  })
})

describe('configId', () => {
  test('matches independent ground truth', () => {
    expect(
      ConfigurableAccount.toConfigId(singleOwnerConfig),
    ).toMatchInlineSnapshot(
      `"0xd1f20e1a5bfdd89488f57f68db5bd1aae9a51b510f4a042b2604b57a0b7b471d"`,
    )
  })

  test('is stable across calls', () => {
    expect(ConfigurableAccount.toConfigId(singleOwnerConfig)).toBe(
      ConfigurableAccount.toConfigId(singleOwnerConfig),
    )
  })

  test('differs for a different salt', () => {
    expect(ConfigurableAccount.toConfigId(singleOwnerConfig)).not.toBe(
      ConfigurableAccount.toConfigId({
        ...singleOwnerConfig,
        salt: `0x${'42'.repeat(32)}`,
      }),
    )
  })

  test('throws on invalid config', () => {
    expect(() =>
      ConfigurableAccount.toConfigId({
        threshold: 5,
        owners: singleOwnerConfig.owners,
      }),
    ).toThrowError()
  })
})

describe('getAddress', () => {
  test('matches independent ground truth', () => {
    expect(
      ConfigurableAccount.getAddress({ config: singleOwnerConfig }),
    ).toMatchInlineSnapshot(`"0x6ca655065b1de473d903eebd50e5cb4996e10468"`)
  })

  test('derives from config or configId identically', () => {
    const configId = ConfigurableAccount.toConfigId(singleOwnerConfig)
    expect(ConfigurableAccount.getAddress({ configId })).toBe(
      ConfigurableAccount.getAddress({ config: singleOwnerConfig }),
    )
  })

  test('config ID and address are chain-independent', () => {
    // Derivation does not include chain ID; identical config → identical id/address.
    const a = ConfigurableAccount.toConfigId(singleOwnerConfig)
    const b = ConfigurableAccount.toConfigId(
      ConfigurableAccount.from(singleOwnerConfig),
    )
    expect(a).toBe(b)
  })
})

describe('getSignPayload', () => {
  test('matches independent ground truth', () => {
    const configId = ConfigurableAccount.toConfigId(singleOwnerConfig)
    const account = ConfigurableAccount.getAddress({ configId })
    expect(
      ConfigurableAccount.getSignPayload({
        payload: `0x${'42'.repeat(32)}`,
        account,
        configId,
      }),
    ).toMatchInlineSnapshot(
      `"0xe3d66f6118b89a67c71c8137c46abf0c829056a46ee6a038a1b42c84529fc17e"`,
    )
  })
})

describe('toTuple / fromTuple', () => {
  test('round-trips', () => {
    const config = ConfigurableAccount.from({
      threshold: 3,
      owners: [
        { owner: owner1, weight: 1 },
        { owner: owner2, weight: 2 },
      ],
    })
    const tuple = ConfigurableAccount.toTuple(config)
    expect(ConfigurableAccount.fromTuple(tuple)).toEqual(config)
  })

  test('encodes each owner as `[owner, weight]`', () => {
    const [, , owners] = ConfigurableAccount.toTuple(singleOwnerConfig)
    expect(owners[0]).toEqual([owner1, '0x1'])
  })

  test('encodes salt as a full 32-byte string (first element)', () => {
    const [salt] = ConfigurableAccount.toTuple(singleOwnerConfig)
    expect(salt).toBe(ConfigurableAccount.zeroSalt)
  })

  test('round-trips a non-zero salt', () => {
    const config = ConfigurableAccount.from({
      ...singleOwnerConfig,
      salt: `0x${'42'.repeat(32)}`,
    })
    const tuple = ConfigurableAccount.toTuple(config)
    expect(tuple[0]).toBe(`0x${'42'.repeat(32)}`)
    expect(ConfigurableAccount.fromTuple(tuple)).toEqual(config)
  })
})

describe('assert / validate', () => {
  test('valid config', () => {
    expect(ConfigurableAccount.validate(singleOwnerConfig)).toBe(true)
  })

  test('empty owners', () => {
    expect(ConfigurableAccount.validate({ threshold: 1, owners: [] })).toBe(
      false,
    )
  })

  test('too many owners', () => {
    const owners = Array.from({ length: 11 }, (_, i) => ({
      owner: `0x${(i + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
      weight: 1,
    }))
    expect(ConfigurableAccount.validate({ threshold: 1, owners })).toBe(false)
  })

  test('zero threshold', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 0,
        owners: singleOwnerConfig.owners,
      }),
    ).toBe(false)
  })

  test('threshold exceeds total weight', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 2,
        owners: singleOwnerConfig.owners,
      }),
    ).toBe(false)
  })

  test('zero owner weight', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 1,
        owners: [{ owner: owner1, weight: 0 }],
      }),
    ).toBe(false)
  })

  test('zero owner address', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 1,
        owners: [
          {
            owner: '0x0000000000000000000000000000000000000000',
            weight: 1,
          },
        ],
      }),
    ).toBe(false)
  })

  test('unsorted owners', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 1,
        owners: [
          { owner: owner2, weight: 1 },
          { owner: owner1, weight: 1 },
        ],
      }),
    ).toBe(false)
  })

  test('duplicate owners', () => {
    expect(
      ConfigurableAccount.validate({
        threshold: 1,
        owners: [
          { owner: owner1, weight: 1 },
          { owner: owner1, weight: 1 },
        ],
      }),
    ).toBe(false)
  })

  test('invalid salt size', () => {
    expect(
      ConfigurableAccount.validate({
        ...singleOwnerConfig,
        salt: '0x42',
      }),
    ).toBe(false)
  })
})

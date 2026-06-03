import { MultisigConfig } from 'ox/tempo'
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
    const config = MultisigConfig.from({
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
      MultisigConfig.from({ threshold: 0, owners: [] }),
    ).toThrowError()
  })
})

describe('genesisConfigId', () => {
  test('matches independent ground truth', () => {
    expect(MultisigConfig.toId(singleOwnerConfig)).toMatchInlineSnapshot(
      `"0xd1f20e1a5bfdd89488f57f68db5bd1aae9a51b510f4a042b2604b57a0b7b471d"`,
    )
  })

  test('is stable across calls', () => {
    expect(MultisigConfig.toId(singleOwnerConfig)).toBe(
      MultisigConfig.toId(singleOwnerConfig),
    )
  })

  test('differs for a different salt', () => {
    expect(MultisigConfig.toId(singleOwnerConfig)).not.toBe(
      MultisigConfig.toId({
        ...singleOwnerConfig,
        salt: `0x${'42'.repeat(32)}`,
      }),
    )
  })

  test('throws on invalid config', () => {
    expect(() =>
      MultisigConfig.toId({
        threshold: 5,
        owners: singleOwnerConfig.owners,
      }),
    ).toThrowError()
  })
})

describe('getAddress', () => {
  test('matches independent ground truth', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig)).toMatchInlineSnapshot(
      `"0x6ca655065b1de473d903eebd50e5cb4996e10468"`,
    )
  })

  test('derives from positional config or `{ genesisConfigId }` identically', () => {
    const genesisConfigId = MultisigConfig.toId(singleOwnerConfig)
    expect(MultisigConfig.getAddress({ genesisConfigId })).toBe(
      MultisigConfig.getAddress(singleOwnerConfig),
    )
  })

  test('config ID and address are chain-independent', () => {
    // Derivation does not include chain ID; identical config → identical id/address.
    const a = MultisigConfig.toId(singleOwnerConfig)
    const b = MultisigConfig.toId(MultisigConfig.from(singleOwnerConfig))
    expect(a).toBe(b)
  })
})

describe('getSignPayload', () => {
  test('matches independent ground truth', () => {
    expect(
      MultisigConfig.getSignPayload({
        payload: `0x${'42'.repeat(32)}`,
        genesisConfig: singleOwnerConfig,
      }),
    ).toMatchInlineSnapshot(
      `"0xe3d66f6118b89a67c71c8137c46abf0c829056a46ee6a038a1b42c84529fc17e"`,
    )
  })

  test('behavior: `genesisConfig` and `{account, genesisConfigId}` produce identical digests', () => {
    const genesisConfigId = MultisigConfig.toId(singleOwnerConfig)
    const account = MultisigConfig.getAddress({ genesisConfigId })
    const payload = `0x${'42'.repeat(32)}` as const
    expect(
      MultisigConfig.getSignPayload({
        payload,
        genesisConfig: singleOwnerConfig,
      }),
    ).toBe(MultisigConfig.getSignPayload({ payload, account, genesisConfigId }))
  })
})

describe('toTuple / fromTuple', () => {
  test('round-trips', () => {
    const config = MultisigConfig.from({
      threshold: 3,
      owners: [
        { owner: owner1, weight: 1 },
        { owner: owner2, weight: 2 },
      ],
    })
    const tuple = MultisigConfig.toTuple(config)
    expect(MultisigConfig.fromTuple(tuple)).toEqual(config)
  })

  test('encodes each owner as `[owner, weight]`', () => {
    const [, , owners] = MultisigConfig.toTuple(singleOwnerConfig)
    expect(owners[0]).toEqual([owner1, '0x1'])
  })

  test('encodes salt as a full 32-byte string (first element)', () => {
    const [salt] = MultisigConfig.toTuple(singleOwnerConfig)
    expect(salt).toBe(MultisigConfig.zeroSalt)
  })

  test('round-trips a non-zero salt', () => {
    const config = MultisigConfig.from({
      ...singleOwnerConfig,
      salt: `0x${'42'.repeat(32)}`,
    })
    const tuple = MultisigConfig.toTuple(config)
    expect(tuple[0]).toBe(`0x${'42'.repeat(32)}`)
    expect(MultisigConfig.fromTuple(tuple)).toEqual(config)
  })
})

describe('assert / validate', () => {
  test('valid config', () => {
    expect(MultisigConfig.validate(singleOwnerConfig)).toBe(true)
  })

  test('empty owners', () => {
    expect(MultisigConfig.validate({ threshold: 1, owners: [] })).toBe(false)
  })

  test('too many owners', () => {
    const owners = Array.from({ length: 11 }, (_, i) => ({
      owner: `0x${(i + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
      weight: 1,
    }))
    expect(MultisigConfig.validate({ threshold: 1, owners })).toBe(false)
  })

  test('zero threshold', () => {
    expect(
      MultisigConfig.validate({
        threshold: 0,
        owners: singleOwnerConfig.owners,
      }),
    ).toBe(false)
  })

  test('threshold exceeds total weight', () => {
    expect(
      MultisigConfig.validate({
        threshold: 2,
        owners: singleOwnerConfig.owners,
      }),
    ).toBe(false)
  })

  test('zero owner weight', () => {
    expect(
      MultisigConfig.validate({
        threshold: 1,
        owners: [{ owner: owner1, weight: 0 }],
      }),
    ).toBe(false)
  })

  test('zero owner address', () => {
    expect(
      MultisigConfig.validate({
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
      MultisigConfig.validate({
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
      MultisigConfig.validate({
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
      MultisigConfig.validate({
        ...singleOwnerConfig,
        salt: '0x42',
      }),
    ).toBe(false)
  })
})

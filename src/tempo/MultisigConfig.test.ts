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

describe('getAddress', () => {
  test('matches independent ground truth', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig)).toMatchInlineSnapshot(
      `"0x8820d1497eeaf4f68e00b2cfc00a2f3b1dbb00da"`,
    )
  })

  test('matches independent ground truth (salt + weights)', () => {
    expect(
      MultisigConfig.getAddress({
        salt: `0x${'42'.repeat(32)}`,
        threshold: 2,
        owners: [
          { owner: owner1, weight: 1 },
          { owner: owner2, weight: 2 },
        ],
      }),
    ).toMatchInlineSnapshot(`"0x0773e28146400643e42cb28f6659b74e7c0b451d"`)
  })

  test('is stable across calls', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig)).toBe(
      MultisigConfig.getAddress(singleOwnerConfig),
    )
  })

  test('differs for a different salt', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig)).not.toBe(
      MultisigConfig.getAddress({
        ...singleOwnerConfig,
        salt: `0x${'42'.repeat(32)}`,
      }),
    )
  })

  test('address is chain-independent', () => {
    // Derivation does not include chain ID; identical config → identical address.
    const a = MultisigConfig.getAddress(singleOwnerConfig)
    const b = MultisigConfig.getAddress(MultisigConfig.from(singleOwnerConfig))
    expect(a).toBe(b)
  })

  test('throws on invalid config', () => {
    expect(() =>
      MultisigConfig.getAddress({
        threshold: 5,
        owners: singleOwnerConfig.owners,
      }),
    ).toThrowError()
  })
})

describe('getSignPayload', () => {
  test('matches independent ground truth', () => {
    expect(
      MultisigConfig.getSignPayload({
        payload: `0x${'de'.repeat(32)}`,
        genesisConfig: singleOwnerConfig,
      }),
    ).toMatchInlineSnapshot(
      `"0x7df8cb9fef4fc2aeb271b617d1a4c6178b720ae1d7564f48a363069b7d77a079"`,
    )
  })

  test('behavior: `genesisConfig` and `{ account }` produce identical digests', () => {
    const account = MultisigConfig.getAddress(singleOwnerConfig)
    const payload = `0x${'42'.repeat(32)}` as const
    expect(
      MultisigConfig.getSignPayload({
        payload,
        genesisConfig: singleOwnerConfig,
      }),
    ).toBe(MultisigConfig.getSignPayload({ payload, account }))
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

  test('accepts 255 owners', () => {
    const owners = Array.from({ length: 255 }, (_, i) => ({
      owner: `0x${(i + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
      weight: 1,
    }))
    expect(MultisigConfig.validate({ threshold: 255, owners })).toBe(true)
  })

  test('too many owners', () => {
    const owners = Array.from({ length: 256 }, (_, i) => ({
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

  test('total weight exceeds u8 max', () => {
    expect(
      MultisigConfig.validate({
        threshold: 255,
        owners: [
          { owner: owner1, weight: 128 },
          { owner: owner2, weight: 128 },
        ],
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

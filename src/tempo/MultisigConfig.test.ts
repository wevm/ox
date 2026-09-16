import { MultisigConfig } from 'ox/tempo'
import { describe, expect, test } from 'vite-plus/test'

// Ground-truth vectors independently computed with ethers over the exact
// preimages defined by TIP-1061 / the Tempo reference implementation.
const factory = '0x7171717171717171717171717171717171717171'
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
    expect(
      MultisigConfig.getAddress(singleOwnerConfig, { factory }),
    ).toMatchInlineSnapshot(`"0x90ba71cb7534da990a1182cf28c9bf415055e03d"`)
  })

  test('matches independent ground truth (salt + weights)', () => {
    expect(
      MultisigConfig.getAddress(
        {
          salt: `0x${'42'.repeat(32)}`,
          threshold: 2,
          owners: [
            { owner: owner1, weight: 1 },
            { owner: owner2, weight: 2 },
          ],
        },
        { factory },
      ),
    ).toMatchInlineSnapshot(`"0x7898a7d1dd96946d2a968de1540ca884a244320c"`)
  })

  test('is stable across calls', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig, { factory })).toBe(
      MultisigConfig.getAddress(singleOwnerConfig, { factory }),
    )
  })

  test('differs for a different salt', () => {
    expect(MultisigConfig.getAddress(singleOwnerConfig, { factory })).not.toBe(
      MultisigConfig.getAddress(
        {
          ...singleOwnerConfig,
          salt: `0x${'42'.repeat(32)}`,
        },
        { factory },
      ),
    )
  })

  test('address is chain-independent', () => {
    // Derivation does not include chain ID; identical config → identical address.
    const a = MultisigConfig.getAddress(singleOwnerConfig, { factory })
    const b = MultisigConfig.getAddress(
      MultisigConfig.from(singleOwnerConfig),
      { factory },
    )
    expect(a).toBe(b)
  })

  test('throws on invalid config', () => {
    expect(() =>
      MultisigConfig.getAddress(
        {
          threshold: 5,
          owners: singleOwnerConfig.owners,
        },
        { factory },
      ),
    ).toThrowError()
  })
})

describe('getSignPayload', () => {
  test('matches independent ground truth', () => {
    expect(
      MultisigConfig.getSignPayload({
        payload: `0x${'de'.repeat(32)}`,
        account: '0x90ba71cb7534da990a1182cf28c9bf415055e03d',
        version: 0n,
      }),
    ).toMatchInlineSnapshot(
      `"0x7c1b66c19bbf803737b541cde34cc4df98962e430da158980257d4482e591b2f"`,
    )
  })

  test('binds the configuration version', () => {
    const value = {
      payload: `0x${'42'.repeat(32)}` as const,
      account: owner1,
    } as const
    expect(MultisigConfig.getSignPayload({ ...value, version: 0n })).not.toBe(
      MultisigConfig.getSignPayload({ ...value, version: 1n }),
    )
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
    const [, , , owners] = MultisigConfig.toTuple(singleOwnerConfig)
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

  test('accepts 48 owners', () => {
    const owners = Array.from({ length: 48 }, (_, i) => ({
      owner: `0x${(i + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
      weight: 1,
    }))
    expect(
      MultisigConfig.validate({
        threshold: MultisigConfig.maxThreshold,
        owners,
      }),
    ).toBe(true)
  })

  test('too many owners', () => {
    const owners = Array.from({ length: 49 }, (_, i) => ({
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

  test('threshold exceeds protocol maximum', () => {
    expect(
      MultisigConfig.validate({
        threshold: MultisigConfig.maxThreshold + 1,
        owners: [{ owner: owner1, weight: MultisigConfig.maxThreshold + 1 }],
      }),
    ).toBe(false)
  })

  test('fractional threshold', () => {
    expect(
      MultisigConfig.validate({
        threshold: 1.5,
        owners: [{ owner: owner1, weight: 2 }],
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
        threshold: MultisigConfig.maxThreshold,
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

  test('fractional owner weight', () => {
    expect(
      MultisigConfig.validate({
        threshold: 1,
        owners: [{ owner: owner1, weight: 1.5 }],
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

describe('version', () => {
  test('preserves uint64 precision', () => {
    const config = MultisigConfig.from({
      ...singleOwnerConfig,
      version: 0xffffffffffffffffn,
    })
    expect(MultisigConfig.toTuple(config)[1]).toMatchInlineSnapshot(
      '"0xffffffffffffffff"',
    )
    expect(MultisigConfig.fromTuple(MultisigConfig.toTuple(config))).toEqual(
      config,
    )
  })
  test.each([-1n, 0x10000000000000000n, 1.5])(
    'rejects invalid version %s',
    (version) => {
      expect(
        MultisigConfig.validate({
          ...singleOwnerConfig,
          version: version as bigint,
        }),
      ).toMatchInlineSnapshot('false')
    },
  )
})

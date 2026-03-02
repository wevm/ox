import { Address, Bech32m } from 'ox'
import { TempoAddress } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const rawAddress = Address.checksum(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
)

describe('format', () => {
  test('mainnet address', () => {
    expect(TempoAddress.format(rawAddress)).toMatchInlineSnapshot(
      `"tempo1wskntnrxxnq9x2f95wuyf0y7wk2l90fg0hlz9j"`,
    )
  })

  test('zone address (zone ID = 1)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 1 }),
    ).toMatchInlineSnapshot(`"tempoz1q96z6dwvvc6vq5efyk3ms39une6etu4a9q2zvzv5"`)
  })

  test('zone address (zone ID = 252)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 252 }),
    ).toMatchInlineSnapshot(`"tempoz1l36z6dwvvc6vq5efyk3ms39une6etu4a9q93kqyj"`)
  })

  test('zone address (zone ID = 253)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 253 }),
    ).toMatchInlineSnapshot(
      `"tempoz1lh7sqapdxhxxvdxq2v5jtgacgj7fuav4727js0pxdhv"`,
    )
  })

  test('zone address (zone ID = 65535)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 65535 }),
    ).toMatchInlineSnapshot(
      `"tempoz1lhll7apdxhxxvdxq2v5jtgacgj7fuav4727jsc6fsc4"`,
    )
  })

  test('zone address (zone ID = 65536)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 65536 }),
    ).toMatchInlineSnapshot(
      `"tempoz1lcqqqqgqwskntnrxxnq9x2f95wuyf0y7wk2l90fga9kw82"`,
    )
  })

  test('zone address (zone ID = 4294967295)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 4294967295 }),
    ).toMatchInlineSnapshot(
      `"tempoz1lmllllllwskntnrxxnq9x2f95wuyf0y7wk2l90fgnd3z52"`,
    )
  })

  test('zone address (zone ID > 4294967295)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: BigInt('4294967296') }),
    ).toMatchInlineSnapshot(
      `"tempoz1luqqqqqqqyqqqqr5956uce35cpfjjfdrhpzte8n4jhet62qelup9g"`,
    )
  })

  test('lowercase output', () => {
    const result = TempoAddress.format(rawAddress)
    expect(result).toBe(result.toLowerCase())
  })
})

describe('parse', () => {
  test('mainnet', () => {
    const encoded = TempoAddress.format(rawAddress)
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": undefined,
      }
    `)
  })

  test('zone (zone ID = 1)', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 1 })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 1n,
      }
    `)
  })

  test('zone (zone ID = 252)', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 252 })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 252n,
      }
    `)
  })

  test('zone (zone ID = 253)', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 253 })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 253n,
      }
    `)
  })

  test('zone (zone ID = 65535)', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 65535 })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 65535n,
      }
    `)
  })

  test('zone (zone ID = 65536)', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 65536 })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 65536n,
      }
    `)
  })

  test('zone (large zone ID)', () => {
    const encoded = TempoAddress.format(rawAddress, {
      zoneId: BigInt('18446744073709551615'),
    })
    expect(TempoAddress.parse(encoded)).toMatchInlineSnapshot(`
      {
        "address": "0x742d35CC6634c0532925a3B844bc9e7595F2Bd28",
        "zoneId": 18446744073709551615n,
      }
    `)
  })

  test('all uppercase', () => {
    const encoded = TempoAddress.format(rawAddress)
    const upper = encoded.toUpperCase()
    expect(TempoAddress.parse(upper).address).toBe(rawAddress)
  })

  test('error: invalid prefix', () => {
    const encoded = Bech32m.encode('bitcoin', new Uint8Array(20))
    expect(() =>
      TempoAddress.parse(encoded),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TempoAddress.InvalidPrefixError: Tempo address "${encoded}" has an invalid prefix. Expected "tempo1" or "tempoz1".]`,
    )
  })

  test('error: invalid checksum', () => {
    const encoded = TempoAddress.format(rawAddress)
    const tampered = encoded.slice(0, -1) + (encoded.endsWith('q') ? 'p' : 'q')
    expect(() =>
      TempoAddress.parse(tampered),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TempoAddress.InvalidChecksumError: Tempo address "${tampered}" has an invalid checksum.]`,
    )
  })

  test('error: prefix swap detected', () => {
    const mainnet = TempoAddress.format(rawAddress)
    const swapped = 'tempoz1' + mainnet.slice(6)
    expect(() =>
      TempoAddress.parse(swapped),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TempoAddress.InvalidChecksumError: Tempo address "tempoz1wskntnrxxnq9x2f95wuyf0y7wk2l90fg0hlz9j" has an invalid checksum.]`,
    )
  })
})

describe('validate', () => {
  test('valid mainnet address', () => {
    const encoded = TempoAddress.format(rawAddress)
    expect(TempoAddress.validate(encoded)).toMatchInlineSnapshot(`true`)
  })

  test('valid zone address', () => {
    const encoded = TempoAddress.format(rawAddress, { zoneId: 1 })
    expect(TempoAddress.validate(encoded)).toMatchInlineSnapshot(`true`)
  })

  test('invalid address', () => {
    expect(TempoAddress.validate('invalid')).toMatchInlineSnapshot(`false`)
  })

  test('tampered address', () => {
    const encoded = TempoAddress.format(rawAddress)
    const tampered = encoded.slice(0, -1) + (encoded.endsWith('q') ? 'p' : 'q')
    expect(TempoAddress.validate(tampered)).toMatchInlineSnapshot(`false`)
  })
})

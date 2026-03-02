import { Address, Bech32m } from 'ox'
import { TempoAddress } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const rawAddress = Address.checksum(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
)

describe('format', () => {
  test('mainnet address', () => {
    expect(TempoAddress.format(rawAddress)).toMatchInlineSnapshot(
      `"tempo1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0"`,
    )
  })

  test('zone address (zone ID = 1)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 1 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qqqhgtf4e3nrfszn9yj68wzyhj08t90jh55q74d9uj"`,
    )
  })

  test('zone address (zone ID = 252)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 252 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qr78gtf4e3nrfszn9yj68wzyhj08t90jh55q9k62jd"`,
    )
  })

  test('zone address (zone ID = 253)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 253 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qr7l6qr5956uce35cpfjjfdrhpzte8n4jhet62q0j8hus"`,
    )
  })

  test('zone address (zone ID = 65535)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 65535 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qr7lllm5956uce35cpfjjfdrhpzte8n4jhet62q8pdj6j"`,
    )
  })

  test('zone address (zone ID = 65536)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 65536 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qrlqqqqpqp6z6dwvvc6vq5efyk3ms39une6etu4a9qdupk5c"`,
    )
  })

  test('zone address (zone ID = 4294967295)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: 4294967295 }),
    ).toMatchInlineSnapshot(
      `"tempoz1qrl0llllla6z6dwvvc6vq5efyk3ms39une6etu4a9qnk36qy"`,
    )
  })

  test('zone address (zone ID > 4294967295)', () => {
    expect(
      TempoAddress.format(rawAddress, { zoneId: BigInt('4294967296') }),
    ).toMatchInlineSnapshot(
      `"tempoz1qrlsqqqqqqqsqqqqwskntnrxxnq9x2f95wuyf0y7wk2l90fg4306kk"`,
    )
  })

  test('lowercase output', () => {
    const result = TempoAddress.format(rawAddress)
    expect(result).toBe(result.toLowerCase())
  })

  test('spec test vectors', () => {
    expect(TempoAddress.format(rawAddress)).toBe(
      'tempo1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0',
    )
    expect(TempoAddress.format(rawAddress, { zoneId: 1 })).toBe(
      'tempoz1qqqhgtf4e3nrfszn9yj68wzyhj08t90jh55q74d9uj',
    )
    expect(TempoAddress.format(rawAddress, { zoneId: 1000 })).toBe(
      'tempoz1qr77sqm5956uce35cpfjjfdrhpzte8n4jhet62qxx4zvx',
    )
    expect(TempoAddress.format(rawAddress, { zoneId: 100000 })).toBe(
      'tempoz1qrl2ppspqp6z6dwvvc6vq5efyk3ms39une6etu4a9qg5477g',
    )
  })

  test('address lengths match spec', () => {
    expect(TempoAddress.format(rawAddress).length).toBe(46)
    expect(TempoAddress.format(rawAddress, { zoneId: 1 }).length).toBe(49)
    expect(TempoAddress.format(rawAddress, { zoneId: 1000 }).length).toBe(52)
    expect(TempoAddress.format(rawAddress, { zoneId: 100000 }).length).toBe(55)
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

  test('error: unsupported version', () => {
    const data = new Uint8Array([0x01, ...new Uint8Array(20)])
    const encoded = Bech32m.encode('tempo', data)
    expect(() => TempoAddress.parse(encoded)).toThrow(
      TempoAddress.InvalidVersionError,
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
      `[TempoAddress.InvalidChecksumError: Tempo address "tempoz1qp6z6dwvvc6vq5efyk3ms39une6etu4a9qtj2kk0" has an invalid checksum.]`,
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

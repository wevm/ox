import { Siwe } from 'ox'
import { describe, expect, test, vi } from 'vitest'

describe('createMessage', () => {
  const message = {
    address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    chainId: 1,
    domain: 'example.com',
    nonce: 'foobarbaz',
    uri: 'https://example.com/path',
    version: '1',
  } satisfies Siwe.Message

  test('default', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(Siwe.createMessage(message)).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: domain', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        domain: 'foo.example.com',
      }),
    ).toMatchInlineSnapshot(`
    "foo.example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z"
  `)

    expect(
      Siwe.createMessage({
        ...message,
        domain: 'example.co.uk',
      }),
    ).toMatchInlineSnapshot(`
    "example.co.uk wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: scheme', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        scheme: 'https',
      }),
    ).toMatchInlineSnapshot(`
    "https://example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: statement', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        statement:
          'I accept the ExampleOrg Terms of Service: https://example.com/tos',
      }),
    ).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

    I accept the ExampleOrg Terms of Service: https://example.com/tos

    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: issuedAt', () => {
    const issuedAt = new Date(Date.UTC(2022, 1, 4))
    expect(Siwe.createMessage({ ...message, issuedAt })).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2022-02-04T00:00:00.000Z"
  `)
  })

  test('parameters: expirationTime', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        expirationTime: new Date(Date.UTC(2022, 1, 4)),
      }),
    ).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z
    Expiration Time: 2022-02-04T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: notBefore', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        notBefore: new Date(Date.UTC(2022, 1, 4)),
      }),
    ).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z
    Not Before: 2022-02-04T00:00:00.000Z"
  `)

    vi.useRealTimers()
  })

  test('parameters: requestId', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        requestId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    ).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z
    Request ID: 123e4567-e89b-12d3-a456-426614174000"
  `)

    vi.useRealTimers()
  })

  test('parameters: resources', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        resources: [
          'https://example.com/foo',
          'https://example.com/bar',
          'https://example.com/baz',
        ],
      }),
    ).toMatchInlineSnapshot(`
    "example.com wants you to sign in with your Ethereum account:
    0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


    URI: https://example.com/path
    Version: 1
    Chain ID: 1
    Nonce: foobarbaz
    Issued At: 2023-02-01T00:00:00.000Z
    Resources:
    - https://example.com/foo
    - https://example.com/bar
    - https://example.com/baz"
  `)

    vi.useRealTimers()
  })

  test('behavior: non-checksummed address', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.createMessage({
        ...message,
        address: '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
      }),
    ).toMatchInlineSnapshot(`
        "example.com wants you to sign in with your Ethereum account:
        0xA0Cf798816D4b9b9866b5330EEa46a18382f251e


        URI: https://example.com/path
        Version: 1
        Chain ID: 1
        Nonce: foobarbaz
        Issued At: 2023-02-01T00:00:00.000Z"
      `)

    vi.useRealTimers()
  })

  test('behavior: invalid address', () => {
    expect(() =>
      Siwe.createMessage({ ...message, address: '0xfoobarbaz' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0xfoobarbaz" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
  })

  test('behavior: invalid chainId', () => {
    expect(() =>
      Siwe.createMessage({ ...message, chainId: 1.1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "chainId".

    - Chain ID must be a EIP-155 chain ID.
    - See https://eips.ethereum.org/EIPS/eip-155

    Provided value: 1.1]
  `)
  })

  test('behavior: invalid domain', () => {
    expect(() =>
      Siwe.createMessage({ ...message, domain: '#foo' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "domain".

    - Domain must be an RFC 3986 authority.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: #foo]
  `)
  })

  test('behavior: invalid nonce', () => {
    expect(() =>
      Siwe.createMessage({ ...message, nonce: '#foo' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "nonce".

    - Nonce must be at least 8 characters.
    - Nonce must be alphanumeric.

    Provided value: #foo]
  `)
  })

  test('behavior: invalid uri', () => {
    expect(() =>
      Siwe.createMessage({ ...message, uri: '#foo' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "uri".

    - URI must be a RFC 3986 URI referring to the resource that is the subject of the signing.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: #foo]
  `)
  })

  test('behavior: invalid version', () => {
    expect(() =>
      // @ts-expect-error
      Siwe.createMessage({ ...message, version: '2' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "version".

    - Version must be '1'.

    Provided value: 2]
  `)
  })

  test('behavior: invalid scheme', () => {
    expect(() =>
      Siwe.createMessage({ ...message, scheme: 'foo_bar' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "scheme".

    - Scheme must be an RFC 3986 URI scheme.
    - See https://www.rfc-editor.org/rfc/rfc3986#section-3.1

    Provided value: foo_bar]
  `)
  })

  test('behavior: invalid statement', () => {
    expect(() =>
      Siwe.createMessage({ ...message, statement: 'foo\nbar' }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "statement".

    - Statement must not include '\\n'.

    Provided value: foo
    bar]
  `)
  })

  test('behavior: invalid resources', () => {
    expect(() =>
      Siwe.createMessage({
        ...message,
        resources: ['https://example.com', 'foo'],
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "resources".

    - Every resource must be a RFC 3986 URI.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: https://example.com]
  `)
  })

  test.each([
    'example.com',
    'localhost',
    '127.0.0.1',
    'example.com:3000',
    'localhost:3000',
    '127.0.0.1:3000',
  ])('valid domain `%s`', (domain) => {
    expect(
      Siwe.createMessage({
        ...message,
        domain,
      }),
    ).toBeTypeOf('string')
  })

  test.each([
    'http://example.com',
    'http://localhost',
    'http://127.0.0.1',
    'http://example.com:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'foobarbaz',
    '-example.com',
  ])('invalid domain `%s`', (domain) => {
    expect(() =>
      Siwe.createMessage({
        ...message,
        domain,
      }),
    ).toThrowError()
  })
})

describe('generateNonce', () => {
  test('default', () => {
    const nonce = Siwe.generateNonce()
    expect(nonce.length).toMatchInlineSnapshot('96')
  })
})

describe('isUri', () => {
  test('default', () => {
    expect(Siwe.isUri('https://example.com/foo')).toMatchInlineSnapshot(
      `"https://example.com/foo"`,
    )
  })

  test('behavior: check for illegal characters', () => {
    expect(Siwe.isUri('^')).toBeFalsy()
  })

  test('incomplete hex escapes', () => {
    expect(Siwe.isUri('%$#')).toBeFalsy()
    expect(Siwe.isUri('%0:#')).toBeFalsy()
  })

  test('missing scheme', () => {
    expect(Siwe.isUri('example.com/foo')).toBeFalsy()
  })

  test('authority with missing path', () => {
    expect(Siwe.isUri('1http:////foo.html')).toBeFalsy()
  })

  test('scheme begins with letter', () => {
    expect(Siwe.isUri('$https://example.com/foo')).toBeFalsy()
  })

  test('query', () => {
    expect(Siwe.isUri('https://example.com/foo?bar')).toMatchInlineSnapshot(
      `"https://example.com/foo?bar"`,
    )
  })

  test('fragment', () => {
    expect(Siwe.isUri('https://example.com/foo#bar')).toMatchInlineSnapshot(
      `"https://example.com/foo#bar"`,
    )
  })
})

describe('parseMessage', () => {
  test('default', () => {
    const message = `example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

I accept the ExampleOrg Terms of Service: https://example.com/tos

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed).toMatchInlineSnapshot(`
    {
      "address": "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
      "chainId": 1,
      "domain": "example.com",
      "issuedAt": 2023-02-01T00:00:00.000Z,
      "nonce": "foobarbaz",
      "statement": "I accept the ExampleOrg Terms of Service: https://example.com/tos",
      "uri": "https://example.com/path",
      "version": "1",
    }
  `)
  })

  test('behavior: with scheme', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.scheme).toMatchInlineSnapshot(`"https"`)
  })

  test('behavior: domain with port', () => {
    const message = `example.com:8080 wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.domain).toMatchInlineSnapshot(`"example.com:8080"`)
  })

  test('behavior: with statement', () => {
    const message = `example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

I accept the ExampleOrg Terms of Service: https://example.com/tos

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.statement).toMatchInlineSnapshot(
      `"I accept the ExampleOrg Terms of Service: https://example.com/tos"`,
    )
  })

  test('behavior: with expirationTime', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z
Expiration Time: 2022-02-04T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.expirationTime).toMatchInlineSnapshot(
      '2022-02-04T00:00:00.000Z',
    )
  })

  test('behavior: with notBefore', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z
Not Before: 2022-02-04T00:00:00.000Z`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.notBefore).toMatchInlineSnapshot('2022-02-04T00:00:00.000Z')
  })

  test('behavior: with requestId', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z
Request ID: 123e4567-e89b-12d3-a456-426614174000`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.requestId).toMatchInlineSnapshot(
      `"123e4567-e89b-12d3-a456-426614174000"`,
    )
  })

  test('behavior: with resources', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z
Resources:
- https://example.com/foo
- https://example.com/bar
- https://example.com/baz`
    const parsed = Siwe.parseMessage(message)
    expect(parsed.resources).toMatchInlineSnapshot(`
    [
      "https://example.com/foo",
      "https://example.com/bar",
      "https://example.com/baz",
    ]
  `)
  })

  test('behavior: no suffix', () => {
    const message = `https://example.com wants you to sign in with your Ethereum account:
0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

`
    const parsed = Siwe.parseMessage(message)
    expect(parsed).toMatchInlineSnapshot(`
    {
      "address": "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
      "domain": "example.com",
      "scheme": "https",
    }
  `)
  })

  test('behavior: no prefix', () => {
    const message = `URI: https://example.com/path
Version: 1
Chain ID: 1
Nonce: foobarbaz
Issued At: 2023-02-01T00:00:00.000Z
Request ID: 123e4567-e89b-12d3-a456-426614174000`
    const parsed = Siwe.parseMessage(message)
    expect(parsed).toMatchInlineSnapshot(`
    {
      "chainId": 1,
      "issuedAt": 2023-02-01T00:00:00.000Z,
      "nonce": "foobarbaz",
      "requestId": "123e4567-e89b-12d3-a456-426614174000",
      "uri": "https://example.com/path",
      "version": "1",
    }
  `)
  })

  test('behavior: bogus message', () => {
    const message = 'foobarbaz'
    const parsed = Siwe.parseMessage(message)
    expect(parsed).toMatchInlineSnapshot('{}')
  })
})

describe('validateMessage', () => {
  const message = {
    address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    chainId: 1,
    domain: 'example.com',
    nonce: 'foobarbaz',
    uri: 'https://example.com/path',
    version: '1',
  } satisfies Siwe.Message

  test('default', () => {
    expect(
      Siwe.validateMessage({
        message,
      }),
    ).toBeTruthy()
  })

  test('behavior: invalid address', () => {
    expect(
      Siwe.validateMessage({
        message: {
          ...message,
          address: undefined,
        },
      }),
    ).toBeFalsy()
  })

  test('behavior: address mismatch', () => {
    expect(
      Siwe.validateMessage({
        address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
        message,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid address', () => {
    expect(
      Siwe.validateMessage({
        address: '0xfoobarbaz',
        message,
      }),
    ).toBeFalsy()
  })

  test('behavior: domain mismatch', () => {
    expect(
      Siwe.validateMessage({
        domain: 'viem.sh',
        message,
      }),
    ).toBeFalsy()
  })

  test('behavior: nonce mismatch', () => {
    expect(
      Siwe.validateMessage({
        nonce: 'f0obarbaz',
        message,
      }),
    ).toBeFalsy()
  })

  test('behavior: scheme mismatch', () => {
    expect(
      Siwe.validateMessage({
        scheme: 'http',
        message: {
          ...message,
          scheme: 'https',
        },
      }),
    ).toBeFalsy()
  })

  test('behavior: time is after expirationTime', () => {
    expect(
      Siwe.validateMessage({
        message: {
          ...message,
          expirationTime: new Date(Date.UTC(2024, 1, 1)),
        },
        time: new Date(Date.UTC(2025, 1, 1)),
      }),
    ).toBeFalsy()
  })

  test('behavior: time is before notBefore', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2023, 1, 1)))

    expect(
      Siwe.validateMessage({
        message: {
          ...message,
          notBefore: new Date(Date.UTC(2024, 1, 1)),
        },
        time: new Date(Date.UTC(2023, 1, 1)),
      }),
    ).toBeFalsy()

    vi.useRealTimers()
  })
})

test('InvalidMessageFieldError', () => {
  expect(
    new Siwe.InvalidMessageFieldError({
      field: 'nonce',
      metaMessages: [
        '- Nonce must be at least 8 characters.',
        '- Nonce must be alphanumeric.',
        '',
        'Provided value: foobarbaz$',
      ],
    }),
  ).toMatchInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "nonce".

    - Nonce must be at least 8 characters.
    - Nonce must be alphanumeric.

    Provided value: foobarbaz$]
  `)
})

test('exports', () => {
  expect(Object.keys(Siwe)).toMatchInlineSnapshot(`
    [
      "domainRegex",
      "ipRegex",
      "localhostRegex",
      "nonceRegex",
      "schemeRegex",
      "prefixRegex",
      "suffixRegex",
      "createMessage",
      "generateNonce",
      "isUri",
      "parseMessage",
      "validateMessage",
      "InvalidMessageFieldError",
    ]
  `)
})

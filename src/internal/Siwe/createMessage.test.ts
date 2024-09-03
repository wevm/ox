import { Siwe } from 'ox'
import { expect, test, vi } from 'vitest'

import type { Siwe_Message } from './types.js'

const message = {
  address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
  chainId: 1,
  domain: 'example.com',
  nonce: 'foobarbaz',
  uri: 'https://example.com/path',
  version: '1',
} satisfies Siwe_Message

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

test('behavior: invalid address', () => {
  expect(() =>
    Siwe.createMessage({ ...message, address: '0xfoobarbaz' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xfoobarbaz" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})

test('behavior: invalid chainId', () => {
  expect(() =>
    Siwe.createMessage({ ...message, chainId: 1.1 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "chainId".

    - Chain ID must be a EIP-155 chain ID.
    - See https://eips.ethereum.org/EIPS/eip-155

    Provided value: 1.1

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid domain', () => {
  expect(() =>
    Siwe.createMessage({ ...message, domain: '#foo' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "domain".

    - Domain must be an RFC 3986 authority.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: #foo

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid nonce', () => {
  expect(() =>
    Siwe.createMessage({ ...message, nonce: '#foo' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "nonce".

    - Nonce must be at least 8 characters.
    - Nonce must be alphanumeric.

    Provided value: #foo

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid uri', () => {
  expect(() =>
    Siwe.createMessage({ ...message, uri: '#foo' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "uri".

    - URI must be a RFC 3986 URI referring to the resource that is the subject of the signing.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: #foo

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid version', () => {
  expect(() =>
    // @ts-expect-error
    Siwe.createMessage({ ...message, version: '2' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "version".

    - Version must be '1'.

    Provided value: 2

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid scheme', () => {
  expect(() =>
    Siwe.createMessage({ ...message, scheme: 'foo_bar' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "scheme".

    - Scheme must be an RFC 3986 URI scheme.
    - See https://www.rfc-editor.org/rfc/rfc3986#section-3.1

    Provided value: foo_bar

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid statement', () => {
  expect(() =>
    Siwe.createMessage({ ...message, statement: 'foo\nbar' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "statement".

    - Statement must not include '\\n'.

    Provided value: foo
    bar

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

test('behavior: invalid resources', () => {
  expect(() =>
    Siwe.createMessage({
      ...message,
      resources: ['https://example.com', 'foo'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "resources".

    - Every resource must be a RFC 3986 URI.
    - See https://www.rfc-editor.org/rfc/rfc3986

    Provided value: https://example.com

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
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

import { expect, test } from 'vitest'

import { BaseError } from './base.js'

test('BaseError', () => {
  expect(new BaseError('An error occurred.')).toMatchInlineSnapshot(
    '[BaseError: An error occurred.]',
  )

  expect(
    new BaseError('An error occurred.', { details: 'details' }),
  ).toMatchInlineSnapshot(`
    [BaseError: An error occurred.

    Details: details]
  `)

  expect(new BaseError('', { details: 'details' })).toMatchInlineSnapshot(
    `
    [BaseError: An error occurred.

    Details: details]
  `,
  )
})

test('BaseError (w/ docsPath)', () => {
  expect(
    new BaseError('An error occurred.', {
      details: 'details',
      docsPath: '/lol',
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An error occurred.

    Details: details
    See: https://oxlib.sh/lol]
  `)
  expect(
    new BaseError('An error occurred.', {
      cause: new BaseError('error', { docsPath: '/docs' }),
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An error occurred.

    Details: error
    See: https://oxlib.sh/docs]
  `)
  expect(
    new BaseError('An error occurred.', {
      cause: new BaseError('error'),
      docsPath: '/lol',
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An error occurred.

    Details: error
    See: https://oxlib.sh/lol]
  `)
  expect(
    new BaseError('An error occurred.', {
      details: 'details',
      docsPath: '/lol',
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An error occurred.

    Details: details
    See: https://oxlib.sh/lol]
  `)
})

test('inherited BaseError', () => {
  const err = new BaseError('An error occurred.', {
    details: 'details',
    docsPath: '/lol',
  })
  expect(
    new BaseError('An internal error occurred.', {
      cause: err,
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An internal error occurred.

    Details: details
    See: https://oxlib.sh/lol]
  `)
})

test('inherited Error', () => {
  const err = new Error('details')
  expect(
    new BaseError('An internal error occurred.', {
      cause: err,
      docsPath: '/lol',
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An internal error occurred.

    Details: details
    See: https://oxlib.sh/lol]
  `)
})

test('metaMessages', () => {
  expect(
    new BaseError('An internal error occurred.', {
      docsPath: '/lol',
      metaMessages: [
        '- Address must be 20 bytes long',
        '- Address must match its checksum counterpart',
      ],
    }),
  ).toMatchInlineSnapshot(`
    [BaseError: An internal error occurred.

    - Address must be 20 bytes long
    - Address must match its checksum counterpart

    See: https://oxlib.sh/lol]
  `)
})

test('walk: no predicate fn (walks to leaf)', () => {
  class FooError<cause extends Error | undefined> extends BaseError<cause> {}
  class BarError extends BaseError {}

  const err = new BaseError('test1', {
    cause: new FooError('test2', { cause: new BarError('test3') }),
  })
  expect(err.walk()).toMatchInlineSnapshot('[BaseError: test3]')
})

test('walk: predicate fn', () => {
  class FooError<cause extends Error | undefined> extends BaseError<cause> {}
  class BarError extends BaseError {}

  const err = new BaseError('test1', {
    cause: new FooError('test2', { cause: new BarError('test3') }),
  })
  expect(err.walk((err) => err instanceof FooError)).toMatchInlineSnapshot(
    `
    [BaseError: test2

    Details: test3]
  `,
  )
})

test('walk: predicate fn (no match)', () => {
  class FooError extends BaseError {}
  class BarError extends BaseError {}

  const err = new BaseError('test1', {
    cause: new Error('test2', { cause: new BarError('test3') }),
  })
  expect(err.walk((err) => err instanceof FooError)).toBeNull()
})

test('properties', () => {
  const err = new BaseError('test1', {
    cause: new Error('test2'),
    docsPath: '/lol',
  })
  expect(
    Object.entries(err).reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {} as any),
  ).toMatchInlineSnapshot(`
    {
      "cause": [Error: test2],
      "details": "test2",
      "docs": "https://oxlib.sh/lol",
      "docsPath": "/lol",
      "name": "BaseError",
      "shortMessage": "test1",
      "version": "ox@x.y.z",
    }
  `)
})

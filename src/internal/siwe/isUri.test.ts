import { expect, test } from 'vitest'

import { isUri } from './isUri.js'

test('default', () => {
  expect(isUri('https://example.com/foo')).toMatchInlineSnapshot(
    `"https://example.com/foo"`,
  )
})

test('behavior: check for illegal characters', () => {
  expect(isUri('^')).toBeFalsy()
})

test('incomplete hex escapes', () => {
  expect(isUri('%$#')).toBeFalsy()
  expect(isUri('%0:#')).toBeFalsy()
})

test('missing scheme', () => {
  expect(isUri('example.com/foo')).toBeFalsy()
})

test('authority with missing path', () => {
  expect(isUri('1http:////foo.html')).toBeFalsy()
})

test('scheme begins with letter', () => {
  expect(isUri('$https://example.com/foo')).toBeFalsy()
})

test('query', () => {
  expect(isUri('https://example.com/foo?bar')).toMatchInlineSnapshot(
    `"https://example.com/foo?bar"`,
  )
})

test('fragment', () => {
  expect(isUri('https://example.com/foo#bar')).toMatchInlineSnapshot(
    `"https://example.com/foo#bar"`,
  )
})

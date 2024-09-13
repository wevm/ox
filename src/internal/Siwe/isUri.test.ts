import { expect, test } from 'vitest'
import { Siwe } from 'ox'

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

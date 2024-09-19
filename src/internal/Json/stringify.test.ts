import { Json } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Json.stringify({
      foo: 'bar',
      baz: {
        value: 69n,
      },
    }),
  ).toEqual('{"foo":"bar","baz":{"value":"69"}}')
})

test('args: replacer', () => {
  expect(
    Json.stringify(
      {
        foo: 'bar',
        baz: {
          value: 69n,
        },
      },
      (key, value) => {
        if (key === 'value') {
          return `${value}!`
        }
        return value
      },
    ),
  ).toEqual('{"foo":"bar","baz":{"value":"69!"}}')
})

test('args: space', () => {
  expect(
    Json.stringify(
      {
        foo: 'bar',
        baz: {
          value: 69n,
        },
      },
      null,
      2,
    ),
  ).toMatchInlineSnapshot(`
    "{
      "foo": "bar",
      "baz": {
        "value": "69"
      }
    }"
  `)
})

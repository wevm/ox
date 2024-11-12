import { Json } from 'ox'
import { describe, expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Json)).toMatchInlineSnapshot(`
    [
      "parse",
      "stringify",
    ]
  `)
})

describe('Json.parse', () => {
  test('default', () => {
    expect(
      Json.parse(
        '{"foo":"bar","baz":{"value1":"69#__bigint","value2":"14124912949129519293629939492394239492349523949321#__bigint","value3":420}}',
      ),
    ).toMatchInlineSnapshot(`
    {
      "baz": {
        "value1": 69n,
        "value2": 14124912949129519293629939492394239492349523949321n,
        "value3": 420,
      },
      "foo": "bar",
    }
  `)
  })

  test('args: replacer', () => {
    expect(
      Json.parse(
        '{"foo":"bar","baz":{"value1":"69#__bigint","value2":"14124912949129519293629939492394239492349523949321#__bigint","value3":420}}',
        (key, value) => {
          if (key === 'value1') return value * 2n
          return value
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "baz": {
        "value1": 69n,
        "value2": 14124912949129519293629939492394239492349523949321n,
        "value3": 420,
      },
      "foo": "bar",
    }
  `)
  })
})

describe('Json.stringify', () => {
  test('default', () => {
    const value = {
      foo: 'bar',
      baz: {
        value1: 69n,
        value2: 14124912949129519293629939492394239492349523949321n,
        value3: 420,
      },
    }
    const string = Json.stringify(value)
    expect(string).toEqual(
      '{"foo":"bar","baz":{"value1":"69#__bigint","value2":"14124912949129519293629939492394239492349523949321#__bigint","value3":420}}',
    )
    expect(Json.parse(string)).toEqual(value)
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
        "value": "69#__bigint"
      }
    }"
  `)
  })
})

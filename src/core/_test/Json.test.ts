import { Json } from 'ox'
import { describe, expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(Json)).toMatchInlineSnapshot(`
    [
      "canonicalize",
      "parse",
      "stringify",
    ]
  `)
})

describe('Json.canonicalize', () => {
  test('default', () => {
    expect(Json.canonicalize({ b: 2, a: 1 })).toBe('{"a":1,"b":2}')
  })

  test('nested objects', () => {
    expect(Json.canonicalize({ z: [3, { y: 1, x: 2 }], a: 'hello' })).toBe(
      '{"a":"hello","z":[3,{"x":2,"y":1}]}',
    )
  })

  test('primitives', () => {
    expect(Json.canonicalize(null)).toBe('null')
    expect(Json.canonicalize(true)).toBe('true')
    expect(Json.canonicalize(false)).toBe('false')
    expect(Json.canonicalize('hello')).toBe('"hello"')
    expect(Json.canonicalize(42)).toBe('42')
  })

  test('number: -0 serializes as 0', () => {
    expect(Json.canonicalize(-0)).toBe('0')
  })

  test('number: trailing zeros removed', () => {
    expect(Json.canonicalize(4.5)).toBe('4.5')
  })

  test('number: NaN throws', () => {
    expect(() => Json.canonicalize(Number.NaN)).toThrow(
      'Cannot canonicalize non-finite number',
    )
  })

  test('number: Infinity throws', () => {
    expect(() => Json.canonicalize(Number.POSITIVE_INFINITY)).toThrow(
      'Cannot canonicalize non-finite number',
    )
  })

  test('bigint throws', () => {
    expect(() => Json.canonicalize(69n as any)).toThrow(
      'Cannot canonicalize bigint',
    )
  })

  test('undefined properties are omitted', () => {
    expect(Json.canonicalize({ a: 1, b: undefined, c: 3 })).toBe(
      '{"a":1,"c":3}',
    )
  })

  test('rfc 8785: sorting', () => {
    // Test from RFC 8785 Section 3.2.3
    // Verifies that keys are sorted by UTF-16 code unit value
    const input = {
      '\u20ac': 'Euro Sign',
      '\r': 'Carriage Return',
      '\ufb33': 'Hebrew Letter Dalet With Dagesh',
      '1': 'One',
      '\ud83d\ude00': 'Emoji: Grinning Face',
      '\u0080': 'Control',
      '\u00f6': 'Latin Small Letter O With Diaeresis',
    }
    const result = Json.canonicalize(input)
    const keys = [...result.matchAll(/"([^"\\]|\\.)*"\s*:/g)].map((m) =>
      JSON.parse(m[0].slice(0, -1)),
    )
    expect(keys).toEqual([
      '\r',
      '1',
      '\u0080',
      '\u00f6',
      '\u20ac',
      '\ud83d\ude00',
      '\ufb33',
    ])
  })

  test('rfc 8785: primitives', () => {
    expect(
      Json.canonicalize({
        numbers: [333333333.3333333, 1e30, 4.5, 0.002, 1e-27],
        literals: [null, true, false],
      }),
    ).toBe(
      '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27]}',
    )
  })
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

import { Json } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Json.parse(
      '{"foo":"bar","baz":{"value1":69n,"value2":14124912949129519293629939492394239492349523949321n,"value3":420}}',
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
      '{"foo":"bar","baz":{"value1":69n,"value2":14124912949129519293629939492394239492349523949321n,"value3":420}}',
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

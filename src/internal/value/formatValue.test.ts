import { Value } from 'ox'
import { expect, test } from 'vitest'

test('converts value to number', () => {
  expect(Value.format(69n)).toMatchInlineSnapshot('"69"')
  expect(Value.format(69n, 0)).toMatchInlineSnapshot('"69"')
  expect(Value.format(69n, 5)).toMatchInlineSnapshot('"0.00069"')
  expect(Value.format(690n, 1)).toMatchInlineSnapshot('"69"')
  expect(Value.format(1300000n, 5)).toMatchInlineSnapshot('"13"')
  expect(Value.format(4200000000000n, 10)).toMatchInlineSnapshot('"420"')
  expect(Value.format(20000000000n, 9)).toMatchInlineSnapshot('"20"')
  expect(Value.format(40000000000000000000n, 18)).toMatchInlineSnapshot('"40"')
  expect(Value.format(10000000000000n, 18)).toMatchInlineSnapshot('"0.00001"')
  expect(Value.format(12345n, 4)).toMatchInlineSnapshot('"1.2345"')
  expect(Value.format(12345n, 4)).toMatchInlineSnapshot('"1.2345"')
  expect(Value.format(6942069420123456789123450000n, 18)).toMatchInlineSnapshot(
    '"6942069420.12345678912345"',
  )
  expect(
    Value.format(
      694212312312306942012345444446789123450000000000000000000000000000000n,
      50,
    ),
  ).toMatchInlineSnapshot('"6942123123123069420.1234544444678912345"')
  expect(Value.format(-690n, 1)).toMatchInlineSnapshot('"-69"')
  expect(Value.format(-1300000n, 5)).toMatchInlineSnapshot('"-13"')
  expect(Value.format(-4200000000000n, 10)).toMatchInlineSnapshot('"-420"')
  expect(Value.format(-20000000000n, 9)).toMatchInlineSnapshot('"-20"')
  expect(Value.format(-40000000000000000000n, 18)).toMatchInlineSnapshot(
    '"-40"',
  )
  expect(Value.format(-12345n, 4)).toMatchInlineSnapshot('"-1.2345"')
  expect(Value.format(-12345n, 4)).toMatchInlineSnapshot('"-1.2345"')
  expect(
    Value.format(-6942069420123456789123450000n, 18),
  ).toMatchInlineSnapshot('"-6942069420.12345678912345"')
  expect(
    Value.format(
      -694212312312306942012345444446789123450000000000000000000000000000000n,
      50,
    ),
  ).toMatchInlineSnapshot('"-6942123123123069420.1234544444678912345"')
})
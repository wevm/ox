import { Value } from 'ox'
import { expect, test } from 'vitest'

test('converts number to unit of a given length', () => {
  expect(Value.from('69')).toMatchInlineSnapshot('69n')
  expect(Value.from('69', 1)).toMatchInlineSnapshot('690n')
  expect(Value.from('13', 5)).toMatchInlineSnapshot('1300000n')
  expect(Value.from('420', 10)).toMatchInlineSnapshot('4200000000000n')
  expect(Value.from('20', 9)).toMatchInlineSnapshot('20000000000n')
  expect(Value.from('40', 18)).toMatchInlineSnapshot('40000000000000000000n')
  expect(Value.from('1.2345', 4)).toMatchInlineSnapshot('12345n')
  expect(Value.from('1.0045', 4)).toMatchInlineSnapshot('10045n')
  expect(Value.from('1.2345000', 4)).toMatchInlineSnapshot('12345n')
  expect(Value.from('6942069420.12345678912345', 18)).toMatchInlineSnapshot(
    '6942069420123456789123450000n',
  )
  expect(Value.from('6942069420.00045678912345', 18)).toMatchInlineSnapshot(
    '6942069420000456789123450000n',
  )
  expect(
    Value.from('6942123123123069420.1234544444678912345', 50),
  ).toMatchInlineSnapshot(
    '694212312312306942012345444446789123450000000000000000000000000000000n',
  )
  expect(Value.from('-69', 1)).toMatchInlineSnapshot('-690n')
  expect(Value.from('-1.2345', 4)).toMatchInlineSnapshot('-12345n')
  expect(Value.from('-6942069420.12345678912345', 18)).toMatchInlineSnapshot(
    '-6942069420123456789123450000n',
  )
  expect(
    Value.from('-6942123123123069420.1234544444678912345', 50),
  ).toMatchInlineSnapshot(
    '-694212312312306942012345444446789123450000000000000000000000000000000n',
  )
})

test('decimals === 0', () => {
  expect(
    Value.from('69.2352112312312451512412341231', 0),
  ).toMatchInlineSnapshot('69n')
  expect(
    Value.from('69.5952141234124125231523412312', 0),
  ).toMatchInlineSnapshot('70n')
  expect(Value.from('12301000000000000020000', 0)).toMatchInlineSnapshot(
    '12301000000000000020000n',
  )
  expect(Value.from('12301000000000000020000.123', 0)).toMatchInlineSnapshot(
    '12301000000000000020000n',
  )
  expect(Value.from('12301000000000000020000.5', 0)).toMatchInlineSnapshot(
    '12301000000000000020001n',
  )
  expect(Value.from('99999999999999999999999.5', 0)).toMatchInlineSnapshot(
    '100000000000000000000000n',
  )
})

test('decimals < fraction length', () => {
  expect(Value.from('69.23521', 0)).toMatchInlineSnapshot('69n')
  expect(Value.from('69.56789', 0)).toMatchInlineSnapshot('70n')
  expect(Value.from('69.23521', 1)).toMatchInlineSnapshot('692n')
  expect(Value.from('69.23521', 2)).toMatchInlineSnapshot('6924n')
  expect(Value.from('69.23221', 2)).toMatchInlineSnapshot('6923n')
  expect(Value.from('69.23261', 3)).toMatchInlineSnapshot('69233n')
  expect(Value.from('999999.99999', 3)).toMatchInlineSnapshot('1000000000n')
  expect(Value.from('699999.99999', 3)).toMatchInlineSnapshot('700000000n')
  expect(Value.from('699999.98999', 3)).toMatchInlineSnapshot('699999990n')
  expect(Value.from('699959.99999', 3)).toMatchInlineSnapshot('699960000n')
  expect(Value.from('699099.99999', 3)).toMatchInlineSnapshot('699100000n')
  expect(Value.from('100000.000999', 3)).toMatchInlineSnapshot('100000001n')
  expect(Value.from('100000.990999', 3)).toMatchInlineSnapshot('100000991n')
  expect(Value.from('69.00221', 3)).toMatchInlineSnapshot('69002n')
  expect(Value.from('1.0536059576998882', 7)).toMatchInlineSnapshot('10536060n')
  expect(Value.from('1.0053059576998882', 7)).toMatchInlineSnapshot('10053060n')
  expect(Value.from('1.0000000900000000', 7)).toMatchInlineSnapshot('10000001n')
  expect(Value.from('1.0000009900000000', 7)).toMatchInlineSnapshot('10000010n')
  expect(Value.from('1.0000099900000000', 7)).toMatchInlineSnapshot('10000100n')
  expect(Value.from('1.0000092900000000', 7)).toMatchInlineSnapshot('10000093n')
  expect(Value.from('1.5536059576998882', 7)).toMatchInlineSnapshot('15536060n')
  expect(Value.from('1.0536059476998882', 7)).toMatchInlineSnapshot('10536059n')
  expect(Value.from('1.4545454545454545', 7)).toMatchInlineSnapshot('14545455n')
  expect(Value.from('1.1234567891234567', 7)).toMatchInlineSnapshot('11234568n')
  expect(Value.from('1.8989898989898989', 7)).toMatchInlineSnapshot('18989899n')
  expect(Value.from('9.9999999999999999', 7)).toMatchInlineSnapshot(
    '100000000n',
  )
  expect(Value.from('0.0536059576998882', 7)).toMatchInlineSnapshot('536060n')
  expect(Value.from('0.0053059576998882', 7)).toMatchInlineSnapshot('53060n')
  expect(Value.from('0.0000000900000000', 7)).toMatchInlineSnapshot('1n')
  expect(Value.from('0.0000009900000000', 7)).toMatchInlineSnapshot('10n')
  expect(Value.from('0.0000099900000000', 7)).toMatchInlineSnapshot('100n')
  expect(Value.from('0.0000092900000000', 7)).toMatchInlineSnapshot('93n')
  expect(Value.from('0.0999999999999999', 7)).toMatchInlineSnapshot('1000000n')
  expect(Value.from('0.0099999999999999', 7)).toMatchInlineSnapshot('100000n')
  expect(Value.from('0.00000000059', 9)).toMatchInlineSnapshot('1n')
  expect(Value.from('0.0000000003', 9)).toMatchInlineSnapshot('0n')
  expect(Value.from('69.00000000000', 9)).toMatchInlineSnapshot('69000000000n')
  expect(Value.from('69.00000000019', 9)).toMatchInlineSnapshot('69000000000n')
  expect(Value.from('69.00000000059', 9)).toMatchInlineSnapshot('69000000001n')
  expect(Value.from('69.59000000059', 9)).toMatchInlineSnapshot('69590000001n')
  expect(Value.from('69.59000002359', 9)).toMatchInlineSnapshot('69590000024n')
})

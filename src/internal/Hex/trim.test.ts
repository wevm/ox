import { Hex } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Hex.trimLeft('0x000000')).toMatchInlineSnapshot('"0x00"')

  expect(
    Hex.trimLeft(
      '0x00000000000000000000000000000000000000000000000000000000a4e12a45',
    ),
  ).toMatchInlineSnapshot('"0xa4e12a45"')

  expect(Hex.trimLeft('0x1')).toMatchInlineSnapshot('"0x01"')
  expect(Hex.trimLeft('0x01')).toMatchInlineSnapshot('"0x01"')
  expect(Hex.trimLeft('0x001')).toMatchInlineSnapshot('"0x01"')
  expect(Hex.trimLeft('0x0001')).toMatchInlineSnapshot('"0x01"')

  expect(
    Hex.trimLeft(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ),
  ).toMatchInlineSnapshot('"0x01"')

  expect(
    Hex.trimLeft(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    ),
  ).toMatchInlineSnapshot('"0x01"')

  expect(
    Hex.trimLeft(
      '0x00000000000000000000000000000000000000000000000000000000a4e12a45',
    ),
  ).toMatchInlineSnapshot('"0xa4e12a45"')

  expect(
    Hex.trimLeft(
      '0x00000000000000000000000000000000000000000000000000000001a4e12a45',
    ),
  ).toMatchInlineSnapshot('"0x01a4e12a45"')

  expect(Hex.trimLeft('0x00012340')).toMatchInlineSnapshot('"0x012340"')
  expect(Hex.trimLeft('0x00102340')).toMatchInlineSnapshot('"0x102340"')

  expect(
    Hex.trimRight(
      '0x1000000000000000000000000000000000000000000000000000000000000000',
    ),
  ).toMatchInlineSnapshot('"0x10"')

  expect(
    Hex.trimRight(
      '0xa4e12a4500000000000000000000000000000000000000000000000000000000',
    ),
  ).toMatchInlineSnapshot('"0xa4e12a45"')

  expect(
    Hex.trimRight(
      '0x1a4e12a450000000000000000000000000000000000000000000000000000000',
    ),
  ).toMatchInlineSnapshot('"0x01a4e12a45"')
})

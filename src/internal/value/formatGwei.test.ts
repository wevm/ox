import { Value } from 'ox'
import { expect, test } from 'vitest'

test('converts wei to gwei', () => {
  expect(Value.formatGwei(69420123456700n)).toMatchInlineSnapshot(
    '"69420.1234567"',
  )
  expect(Value.formatGwei(69420000000000n)).toMatchInlineSnapshot('"69420"')
  expect(Value.formatGwei(1000000000n)).toMatchInlineSnapshot('"1"')
  expect(Value.formatGwei(500000000n)).toMatchInlineSnapshot('"0.5"')
  expect(Value.formatGwei(100000000n)).toMatchInlineSnapshot('"0.1"')
  expect(Value.formatGwei(10000000n)).toMatchInlineSnapshot('"0.01"')
  expect(Value.formatGwei(1000000n)).toMatchInlineSnapshot('"0.001"')
  expect(Value.formatGwei(100000n)).toMatchInlineSnapshot('"0.0001"')
  expect(Value.formatGwei(10000n)).toMatchInlineSnapshot('"0.00001"')
  expect(Value.formatGwei(1000n)).toMatchInlineSnapshot('"0.000001"')
  expect(Value.formatGwei(100n)).toMatchInlineSnapshot('"0.0000001"')
  expect(Value.formatGwei(10n)).toMatchInlineSnapshot('"0.00000001"')
  expect(Value.formatGwei(1n)).toMatchInlineSnapshot('"0.000000001"')
  expect(Value.formatGwei(-69420123456700n)).toMatchInlineSnapshot(
    '"-69420.1234567"',
  )
  expect(Value.formatGwei(-69420000000000n)).toMatchInlineSnapshot('"-69420"')
  expect(Value.formatGwei(-1000000000n)).toMatchInlineSnapshot('"-1"')
  expect(Value.formatGwei(-500000000n)).toMatchInlineSnapshot('"-0.5"')
  expect(Value.formatGwei(-100000000n)).toMatchInlineSnapshot('"-0.1"')
  expect(Value.formatGwei(-10000000n)).toMatchInlineSnapshot('"-0.01"')
  expect(Value.formatGwei(-1000000n)).toMatchInlineSnapshot('"-0.001"')
  expect(Value.formatGwei(-100000n)).toMatchInlineSnapshot('"-0.0001"')
  expect(Value.formatGwei(-10000n)).toMatchInlineSnapshot('"-0.00001"')
  expect(Value.formatGwei(-1000n)).toMatchInlineSnapshot('"-0.000001"')
  expect(Value.formatGwei(-100n)).toMatchInlineSnapshot('"-0.0000001"')
  expect(Value.formatGwei(-10n)).toMatchInlineSnapshot('"-0.00000001"')
  expect(Value.formatGwei(-1n)).toMatchInlineSnapshot('"-0.000000001"')
})

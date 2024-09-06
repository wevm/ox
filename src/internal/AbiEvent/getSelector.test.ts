import { AbiEvent } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    AbiEvent.getSelector(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ),
  ).toEqual(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  )
  expect(
    AbiEvent.getSelector(
      'Transfer(address indexed from, address indexed to, uint256 value)',
    ),
  ).toEqual(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  )
})

test('behavior: from `AbiEvent`', () => {
  expect(
    AbiEvent.getSelector(
      AbiEvent.from(
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ),
    ),
  ).toEqual(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  )
})

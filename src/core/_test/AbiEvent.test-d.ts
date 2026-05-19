import { Abi, AbiEvent } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('decodeLog', () => {
  test('behavior: abi', () => {
    const abi = Abi.from([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ])
    const decoded = AbiEvent.decodeLog(abi, {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })

    expectTypeOf(decoded.args).toEqualTypeOf<{
      from: `0x${string}`
      to: `0x${string}`
      value: bigint
    }>()
  })
})

describe('decodeLogs', () => {
  test('behavior: abi', () => {
    const abi = Abi.from([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ])
    const log = {
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const decoded = AbiEvent.decodeLogs(abi, [log])

    expectTypeOf(decoded[0]!.args).toEqualTypeOf<{
      from: `0x${string}`
      to: `0x${string}`
      value: bigint
    }>()
    expectTypeOf(decoded[0]!.log).toEqualTypeOf<typeof log>()
  })
})

describe('decode', () => {
  test('behavior: event', () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    )
    const decoded = AbiEvent.decode(transfer, {
      topics: [
        AbiEvent.getSelector(transfer),
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    })

    expectTypeOf(decoded).toEqualTypeOf<{
      from: `0x${string}`
      to: `0x${string}`
      value: bigint
    }>()
  })
})

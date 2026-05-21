import { Abi, AbiEvent } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

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

describe('extractLogs', () => {
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
    const decoded = AbiEvent.extractLogs(abi, [log])

    expectTypeOf(decoded[0]!.args).toEqualTypeOf<{
      from: `0x${string}`
      to: `0x${string}`
      value: bigint
    }>()
    expectTypeOf(decoded[0]!.eventName).toEqualTypeOf<'Transfer'>()
    expectTypeOf(decoded[0]!.data).toEqualTypeOf<typeof log.data>()
  })

  test('behavior: event name', () => {
    const abi = Abi.from([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)',
    ])
    const log = {
      topics: [
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
        '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
        '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ],
      data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const decoded = AbiEvent.extractLogs(abi, [log], { eventName: 'Approval' })

    expectTypeOf(decoded[0]!.args).toEqualTypeOf<{
      owner: `0x${string}`
      spender: `0x${string}`
      value: bigint
    }>()
    expectTypeOf(decoded[0]!.eventName).toEqualTypeOf<'Approval'>()
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

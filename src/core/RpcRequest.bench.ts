import { bench, describe } from 'vitest'
import * as RpcRequest from './RpcRequest.js'

describe('RpcRequest.createStore: prepare', () => {
  const store = RpcRequest.createStore()

  bench('prepare(no params)', () => {
    store.prepare({ method: 'eth_blockNumber' })
  })

  bench('prepare(with params)', () => {
    store.prepare({
      method: 'eth_call',
      params: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    } as never)
  })
})

describe('RpcRequest.from', () => {
  bench('from(no params)', () => {
    RpcRequest.from({ id: 0, method: 'eth_blockNumber' })
  })

  bench('from(with params)', () => {
    RpcRequest.from({
      id: 0,
      method: 'eth_call',
      params: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    } as never)
  })
})

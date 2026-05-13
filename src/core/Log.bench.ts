import { bench, describe } from 'vitest'
import * as Log from './Log.js'

const baseRpc: Log.Rpc = {
  address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
  blockHash:
    '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
  blockNumber: '0x12d846c',
  data: '0x',
  logIndex: '0x10f',
  removed: false,
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
    '0x000000000000000000000000000000000000000000000000000000000000025b',
  ],
  transactionHash:
    '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
  transactionIndex: '0x91',
}

const parsed = Log.fromRpc(baseRpc)

const batch10 = Array.from({ length: 10 }, () => baseRpc)
const batch100 = Array.from({ length: 100 }, () => baseRpc)

const parsed10 = batch10.map((log) => Log.fromRpc(log))
const parsed100 = batch100.map((log) => Log.fromRpc(log))

describe('Log.fromRpc', () => {
  bench('single', () => {
    Log.fromRpc(baseRpc)
  })
  bench('batch of 10', () => {
    for (const log of batch10) Log.fromRpc(log)
  })
  bench('batch of 100', () => {
    for (const log of batch100) Log.fromRpc(log)
  })
})

describe('Log.toRpc', () => {
  bench('single', () => {
    Log.toRpc(parsed)
  })
  bench('batch of 10', () => {
    for (const log of parsed10) Log.toRpc(log)
  })
  bench('batch of 100', () => {
    for (const log of parsed100) Log.toRpc(log)
  })
})

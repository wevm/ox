import { Interface } from 'ethers'
import { AbiFunction } from 'ox'
import { bench, describe } from 'vitest'
import { Web3 } from 'web3'
import { AbiFunction_encodeInput } from './encodeInput.js'

const fn = AbiFunction.from(
  'function foo(uint a, (string x, bytes y) b, bytes c, (uint x, (bytes a, bytes b)[] y) d)',
)

const web3 = new Web3()

describe('ABI-encode function inputs', () => {
  bench('ox', () => {
    AbiFunction_encodeInput(fn, [
      69420n,
      { x: 'hi', y: '0xdeadbeef' },
      '0xdeadbeef',
      { x: 42069n, y: [{ a: '0xdeadbeef', b: '0xdeadbeef' }] },
    ])
  })

  bench('ethers', () => {
    const iface = new Interface([fn])
    iface.encodeFunctionData('foo', [
      69420n,
      { x: 'hi', y: '0xdeadbeef' },
      '0xdeadbeef',
      { x: 42069n, y: [{ a: '0xdeadbeef', b: '0xdeadbeef' }] },
    ])
  })

  bench('web3', () => {
    web3.eth.abi.encodeFunctionCall(fn, [
      69420n,
      { x: 'hi', y: '0xdeadbeef' },
      '0xdeadbeef',
      { x: 42069n, y: [{ a: '0xdeadbeef', b: '0xdeadbeef' }] },
    ])
  })
})

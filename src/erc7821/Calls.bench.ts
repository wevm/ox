import { bench, describe } from 'vp/test'
import * as Calls from './Calls.js'

const calls = [
  {
    data: '0xdeadbeef',
    to: '0xcafebabecafebabecafebabecafebabecafebabe',
    value: 1n,
  },
  {
    data: '0xcafebabe',
    to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    value: 2n,
  },
] as const satisfies readonly Calls.Call[]

const encoded = Calls.encode(calls)
const encodedWithOpData = Calls.encode(calls, { opData: '0x1234567890abcdef' })

describe('Calls', () => {
  bench('encode', () => {
    Calls.encode(calls)
  })

  bench('encode (with opData)', () => {
    Calls.encode(calls, { opData: '0x1234567890abcdef' })
  })

  bench('decode', () => {
    Calls.decode(encoded)
  })

  bench('decode (with opData)', () => {
    Calls.decode(encodedWithOpData, { opData: true })
  })
})

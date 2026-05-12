import { bench, describe } from 'vitest'
import * as RpcRequest from './RpcRequest.js'
import * as RpcResponse from './RpcResponse.js'

const successResponse = {
  id: 0,
  jsonrpc: '2.0',
  result: '0x1a2b3c',
} as const

const errorResponse = {
  id: 0,
  jsonrpc: '2.0',
  error: { code: -32000, message: 'oops' },
} as const

describe('RpcResponse.parse', () => {
  bench('parse(success)', () => {
    RpcResponse.parse(successResponse)
  })

  bench('parse(success, raw)', () => {
    RpcResponse.parse(successResponse, { raw: true })
  })

  bench('parse(error, raw)', () => {
    RpcResponse.parse(errorResponse, { raw: true })
  })
})

describe('RpcResponse.from', () => {
  const request = RpcRequest.from({ id: 1, method: 'eth_blockNumber' })

  bench('from(complete envelope)', () => {
    RpcResponse.from(successResponse, { request })
  })

  bench('from(missing id+jsonrpc)', () => {
    RpcResponse.from({ result: '0x1' } as never, { request })
  })

  bench('from(no request, complete)', () => {
    RpcResponse.from(successResponse)
  })
})

describe('RpcResponse.parseError', () => {
  const knownCodes = [
    -32000, -32001, -32002, -32003, -32004, -32005, -32006, -32600, -32601,
    -32602, -32603, -32700,
  ]
  const errors = knownCodes.map((code) => ({ code, message: 'm' }))

  bench('parseError(known code rotating)', () => {
    for (const error of errors) RpcResponse.parseError(error)
  })

  bench('parseError(unknown code)', () => {
    RpcResponse.parseError({ code: 9999, message: 'unknown' })
  })

  bench('parseError(plain Error)', () => {
    RpcResponse.parseError(new Error('boom'))
  })
})

import { type Hex, RpcRequest, RpcResponse } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

describe('from', () => {
  test('default', async () => {
    const response = RpcResponse.from({
      id: 0,
      jsonrpc: '2.0',
      result: '0xdeadbeef',
    })
    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0xdeadbeef",
      }
    `)
  })

  test('behavior: with request', () => {
    const request = RpcRequest.from({ id: 0, method: 'eth_blockNumber' })

    const response = RpcResponse.from(
      {
        id: 0,
        jsonrpc: '2.0',
        result: '0xdeadbeef',
      },
      { request },
    )
    expect(response).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0xdeadbeef",
      }
    `)
  })
})

describe('parse', () => {
  test('default', async () => {
    const request = RpcRequest.from({
      method: 'eth_estimateGas',
      params: [
        {
          from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      id: 0,
    })

    const raw = await fetch(anvilMainnet.rpcUrl, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then((res) => res.json())

    const gas = RpcResponse.parse(raw)
    assertType<unknown>(gas)

    expect(gas).toMatchInlineSnapshot(`"0x5208"`)
  })

  test('error', async () => {
    const request = RpcRequest.from({
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      id: 0,
    })

    const raw = await fetch(anvilMainnet.rpcUrl, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then((res) => res.json())

    expect(() => RpcResponse.parse(raw)).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InvalidParamsError: No Signer available]',
    )
  })

  test('options: request', async () => {
    const request = RpcRequest.from({
      method: 'eth_estimateGas',
      params: [
        {
          from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      id: 0,
    })

    const raw = await fetch(anvilMainnet.rpcUrl, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then((res) => res.json())

    const gas = RpcResponse.parse(raw, {
      request,
    })
    assertType<Hex.Hex>(gas)

    expect(gas).toMatchInlineSnapshot(`"0x5208"`)
  })

  test('options: safe', async () => {
    const request = RpcRequest.from({
      method: 'eth_estimateGas',
      params: [
        {
          from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          to: '0x0000000000000000000000000000000000000000',
        },
      ],
      id: 0,
    })

    const json = await fetch(anvilMainnet.rpcUrl, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then((res) => res.json())

    {
      const response = RpcResponse.parse(json, {
        request,
        raw: true,
      })
      assertType<RpcResponse.RpcResponse<Hex.Hex>>(response)

      expect(response).toMatchInlineSnapshot(`
        {
          "id": 0,
          "jsonrpc": "2.0",
          "result": "0x5208",
        }
      `)
    }

    {
      const response = RpcResponse.parse(json, {
        raw: true,
      })
      assertType<RpcResponse.RpcResponse<unknown>>(response)
    }
  })

  test('behavior: throws JsonRpc.InvalidInputError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32000,
          message: 'Internal error',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InvalidInputError: Internal error]',
    )
  })

  test('behavior: throws JsonRpc.ResourceNotFoundError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32001,
          message: 'Resource not found',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.ResourceNotFoundError: Resource not found]',
    )
  })

  test('behavior: throws JsonRpc.ResourceUnavailableError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32002,
          message: 'Resource unavailable',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.ResourceUnavailableError: Resource unavailable]',
    )
  })

  test('behavior: throws JsonRpc.TransactionRejectedError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32003,
          message: 'Transaction rejected',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.TransactionRejectedError: Transaction rejected]',
    )
  })

  test('behavior: throws JsonRpc.MethodNotSupportedError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32004,
          message: 'Method not supported',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.MethodNotSupportedError: Method not supported]',
    )
  })

  test('behavior: throws JsonRpc.LimitExceededError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32005,
          message: 'Limit exceeded',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.LimitExceededError: Limit exceeded]',
    )
  })

  test('behavior: throws JsonRpc.VersionNotSupportedError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32006,
          message: 'Version not supported',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.VersionNotSupportedError: Version not supported]',
    )
  })

  test('behavior: throws JsonRpc.InvalidRequestError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InvalidRequestError: Invalid Request]',
    )
  })

  test('behavior: throws JsonRpc.MethodNotFoundError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.MethodNotFoundError: Method not found]',
    )
  })

  test('behavior: throws JsonRpc.InvalidParamsError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32602,
          message: 'Method not found',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InvalidParamsError: Method not found]',
    )
  })

  test('behavior: throws JsonRpc.InternalError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32603,
          message: 'Internal JSON-RPC error.',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InternalError: Internal JSON-RPC error.]',
    )
  })

  test('behavior: throws JsonRpc.ParseError', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32700,
          message: 'Method not found',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.ParseError: Method not found]',
    )
  })

  test('behavior: throws JsonRpc.Error', () => {
    expect(() =>
      RpcResponse.parse({
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: 69420,
          message: 'oh no',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot('[RpcResponse.InternalError: oh no]')
  })
})

describe('parseError', () => {
  test('InternalError', () => {
    const error = RpcResponse.parseError({
      code: -32603,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot('[RpcResponse.InternalError: foo]')
  })

  test('InvalidInputError', () => {
    const error = RpcResponse.parseError({
      code: -32000,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot('[RpcResponse.InvalidInputError: foo]')
  })

  test('InvalidParamsError', () => {
    const error = RpcResponse.parseError({
      code: -32602,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot('[RpcResponse.InvalidParamsError: foo]')
  })

  test('InvalidRequestError', () => {
    const error = RpcResponse.parseError({
      code: -32600,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.InvalidRequestError: foo]',
    )
  })

  test('LimitExceededError', () => {
    const error = RpcResponse.parseError({
      code: -32005,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot('[RpcResponse.LimitExceededError: foo]')
  })

  test('MethodNotFoundError', () => {
    const error = RpcResponse.parseError({
      code: -32601,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.MethodNotFoundError: foo]',
    )
  })

  test('MethodNotSupportedError', () => {
    const error = RpcResponse.parseError({
      code: -32004,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.MethodNotSupportedError: foo]',
    )
  })

  test('ParseError', () => {
    const error = RpcResponse.parseError({
      code: -32700,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot('[RpcResponse.ParseError: foo]')
  })

  test('ResourceNotFoundError', () => {
    const error = RpcResponse.parseError({
      code: -32001,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.ResourceNotFoundError: foo]',
    )
  })

  test('ResourceUnavailableError', () => {
    const error = RpcResponse.parseError({
      code: -32002,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.ResourceUnavailableError: foo]',
    )
  })

  test('TransactionRejectedError', () => {
    const error = RpcResponse.parseError({
      code: -32003,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.TransactionRejectedError: foo]',
    )
  })

  test('VersionNotSupportedError', () => {
    const error = RpcResponse.parseError({
      code: -32006,
      message: 'foo',
    })
    expect(error).toMatchInlineSnapshot(
      '[RpcResponse.VersionNotSupportedError: foo]',
    )
  })

  test('BaseError', () => {
    const error = RpcResponse.parseError({
      code: -69420,
      message: 'foo',
    })
    const { code, message } = error.data as RpcResponse.ErrorObject
    expect(code).toBe(-69420)
    expect(message).toBe('foo')
    expect(error).toMatchInlineSnapshot('[RpcResponse.InternalError: foo]')
  })
})

test('InvalidInputError', () => {
  expect(new RpcResponse.InvalidInputError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidInputError: Missing or invalid parameters.]',
  )
  expect(
    new RpcResponse.InvalidInputError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidInputError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidInputError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidInputError","code":-32000}"`,
  )
})

test('ResourceNotFoundError', () => {
  expect(new RpcResponse.ResourceNotFoundError()).toMatchInlineSnapshot(
    '[RpcResponse.ResourceNotFoundError: Requested resource not found.]',
  )
  expect(
    new RpcResponse.ResourceNotFoundError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.ResourceNotFoundError: foo]')
  expect(
    JSON.stringify(new RpcResponse.ResourceNotFoundError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ResourceNotFoundError","code":-32001}"`,
  )
})

test('ResourceUnavailableError', () => {
  expect(new RpcResponse.ResourceUnavailableError()).toMatchInlineSnapshot(
    '[RpcResponse.ResourceUnavailableError: Requested resource not available.]',
  )
  expect(
    new RpcResponse.ResourceUnavailableError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.ResourceUnavailableError: foo]')
  expect(
    JSON.stringify(new RpcResponse.ResourceUnavailableError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ResourceUnavailableError","code":-32002}"`,
  )
})

test('TransactionRejectedError', () => {
  expect(new RpcResponse.TransactionRejectedError()).toMatchInlineSnapshot(
    '[RpcResponse.TransactionRejectedError: Transaction creation failed.]',
  )
  expect(
    new RpcResponse.TransactionRejectedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.TransactionRejectedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.TransactionRejectedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.TransactionRejectedError","code":-32003}"`,
  )
})

test('MethodNotSupportedError', () => {
  expect(new RpcResponse.MethodNotSupportedError()).toMatchInlineSnapshot(
    '[RpcResponse.MethodNotSupportedError: Method is not implemented.]',
  )
  expect(
    new RpcResponse.MethodNotSupportedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.MethodNotSupportedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.MethodNotSupportedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.MethodNotSupportedError","code":-32004}"`,
  )
})

test('LimitExceededError', () => {
  expect(new RpcResponse.LimitExceededError()).toMatchInlineSnapshot(
    '[RpcResponse.LimitExceededError: Rate limit exceeded.]',
  )
  expect(
    new RpcResponse.LimitExceededError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.LimitExceededError: foo]')
  expect(
    JSON.stringify(new RpcResponse.LimitExceededError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.LimitExceededError","code":-32005}"`,
  )
})

test('VersionNotSupportedError', () => {
  expect(new RpcResponse.VersionNotSupportedError()).toMatchInlineSnapshot(
    '[RpcResponse.VersionNotSupportedError: JSON-RPC version not supported.]',
  )
  expect(
    new RpcResponse.VersionNotSupportedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.VersionNotSupportedError: foo]')
  expect(
    JSON.stringify(new RpcResponse.VersionNotSupportedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.VersionNotSupportedError","code":-32006}"`,
  )
})

test('InvalidRequestError', () => {
  expect(new RpcResponse.InvalidRequestError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidRequestError: Input is not a valid JSON-RPC request.]',
  )
  expect(
    new RpcResponse.InvalidRequestError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidRequestError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidRequestError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidRequestError","code":-32600}"`,
  )
})

test('MethodNotFoundError', () => {
  expect(new RpcResponse.MethodNotFoundError()).toMatchInlineSnapshot(
    '[RpcResponse.MethodNotFoundError: Method does not exist.]',
  )
  expect(
    new RpcResponse.MethodNotFoundError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.MethodNotFoundError: foo]')
  expect(
    JSON.stringify(new RpcResponse.MethodNotFoundError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.MethodNotFoundError","code":-32601}"`,
  )
})

test('InvalidParamsError', () => {
  expect(new RpcResponse.InvalidParamsError()).toMatchInlineSnapshot(
    '[RpcResponse.InvalidParamsError: Invalid method parameters.]',
  )
  expect(
    new RpcResponse.InvalidParamsError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InvalidParamsError: foo]')
  expect(
    JSON.stringify(new RpcResponse.InvalidParamsError()),
  ).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InvalidParamsError","code":-32602}"`,
  )
})

test('InternalError', () => {
  expect(new RpcResponse.InternalError()).toMatchInlineSnapshot(
    '[RpcResponse.InternalError: Internal JSON-RPC error.]',
  )
  expect(
    new RpcResponse.InternalError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[RpcResponse.InternalError: foo]')
  expect(JSON.stringify(new RpcResponse.InternalError())).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.InternalError","code":-32603}"`,
  )
})

test('ParseError', () => {
  expect(new RpcResponse.ParseError()).toMatchInlineSnapshot(
    '[RpcResponse.ParseError: Failed to parse JSON-RPC response.]',
  )
  expect(new RpcResponse.ParseError({ message: 'foo' })).toMatchInlineSnapshot(
    '[RpcResponse.ParseError: foo]',
  )
  expect(JSON.stringify(new RpcResponse.ParseError())).toMatchInlineSnapshot(
    `"{"name":"RpcResponse.ParseError","code":-32700}"`,
  )
})

test('exports', () => {
  expect(Object.keys(RpcResponse)).toMatchInlineSnapshot(`
    [
      "from",
      "parse",
      "parseError",
      "BaseError",
      "InvalidInputError",
      "ResourceNotFoundError",
      "ResourceUnavailableError",
      "TransactionRejectedError",
      "MethodNotSupportedError",
      "LimitExceededError",
      "VersionNotSupportedError",
      "InvalidRequestError",
      "MethodNotFoundError",
      "InvalidParamsError",
      "InternalError",
      "ParseError",
    ]
  `)
})

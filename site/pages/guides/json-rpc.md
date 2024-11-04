# JSON-RPC

## Overview

For an Application to communicate with the Ethereum network, it needs to establish a connection to an Ethereum Node, and be able to send and receive messages in a standardized format.

All Ethereum Nodes implement the [JSON-RPC specification](https://www.jsonrpc.org/specification), which is a stateless & lightweight remote procedure call (RPC) protocol.

Ox provides type-safe primitives for working with the [JSON-RPC specification](https://www.jsonrpc.org/specification).

## Examples

### Sending a Request

The example below demonstrates sending a strongly-typed JSON-RPC request to an Ethereum Node using an auto-incrementing JSON-RPC `id` store via [`RpcRequest.createStore`](/api/RpcRequest/createStore).

```ts twoslash
import { RpcRequest } from 'ox'

// 1. Create a request store.
const store = RpcRequest.createStore()

// 2. Prepare a request.
const request = store.prepare({
  method: 'eth_getBlockByNumber',
  params: ['latest', false],
})

// 3. Send the request to an Ethereum Node.
const response = await fetch('https://1.rpc.thirdweb.com', {
  body: JSON.stringify(request),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}).then((res) => res.json())
```

:::note

You can also use the [`RpcRequest.from`](/api/RpcRequest/from) function to create a request and manage the `id` manually.

```ts twoslash
// @noErrors
import { RpcRequest } from 'ox'

const request = RpcRequest.from({ // [!code focus]
  id: 0, // [!code focus]
  method: 'eth_getBlockByNumber', // [!code focus]
  params: ['latest', false], // [!code focus]
}) // [!code focus]

const response = await fetch('https://1.rpc.thirdweb.com', {
  body: JSON.stringify(request),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}).then((res) => res.json())
```

:::

### Parsing a Response

The example below demonstrates parsing a JSON-RPC response using the [`RpcResponse.parse`](/api/RpcResponse/parse) function. This will extract the JSON-RPC `result` and and strongly type the response based on the `request` used.

```ts twoslash
import { RpcRequest, RpcResponse } from 'ox'

// 1. Create a request store.
const store = RpcRequest.createStore()

// 2. Prepare a request.
const request = store.prepare({
  method: 'eth_getBlockByNumber',
  params: ['latest', false],
})

// 3. Send the request to an Ethereum Node.
const response = await fetch('https://1.rpc.thirdweb.com', {
  body: JSON.stringify(request),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((res) => res.json())
  // 4. Parse the response. // [!code focus]
  .then((res) => RpcResponse.parse(res, { request })) // [!code focus]

response // [!code focus]
//  ^?











```

:::tip

**Tip:** Setting `raw` to `true` will return the raw JSON-RPC response object.

```ts twoslash
// @noErrors
import { RpcRequest, RpcResponse } from 'ox'

// 1. Create a request store.
const store = RpcRequest.createStore()

// 2. Prepare a request.
const request = store.prepare({
  method: 'eth_getBlockByNumber',
  params: ['latest', false],
})

// 3. Send the request to an Ethereum Node.
const response = await fetch('https://1.rpc.thirdweb.com', {
  body: JSON.stringify(request),
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((res) => res.json())
// ---cut---
  .then((res) => RpcResponse.parse(res, { request, raw: true })) // [!code focus]

response // [!code focus]
//  ^?















```

:::

### Handling Requests

If you need to handle incoming JSON-RPC requests and return a respective response (for example, if you are building an JSON-RPC API handler or an [EIP-1193 Provider `request` handler](/api/Provider/from#instantiating-a-custom-provider) in a Wallet), you can utilize the [`RpcResponse.from`](/api/RpcResponse/from) function.

```ts twoslash
// @noErrors
import { RpcRequest, RpcResponse, RpcSchema } from 'ox'

const accounts = ['0x...', '0x...'] as const

async function handleRequest(request: RpcRequest.RpcRequest<RpcSchema.Eth>) {
  if (request.method === 'eth_accounts')
    return RpcResponse.from({ result: accounts }, { request })
  if (request.method === 'eth_chainId')
    return RpcResponse.from({ result: '0x1' }, { request })
  if (request.method === 'eth_getBlock')
  //                                  ^|




  return await fetch('https://1.rpc.thirdweb.com', {
    body: JSON.stringify(request),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((res) => RpcResponse.from(res))
}
```

## Related Modules

| Module                            | Description                                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RpcRequest](/api/RpcRequest)     | Utility types & functions for working with [JSON-RPC 2.0 Requests](https://www.jsonrpc.org/specification#request_object) and Ethereum JSON-RPC methods as defined on the [Ethereum API specification](https://github.com/ethereum/execution-apis) |
| [RpcResponse](/api/RpcResponse)   | Utility types & functions for working with [JSON-RPC 2.0 Responses](https://www.jsonrpc.org/specification#response_object)                                                                                                                        |
| [RpcSchema](/api/RpcSchema)       | Utility types for working with Ethereum JSON-RPC namespaces & schemas.                                                                                                                                                                            |
| [RpcTransport](/api/RpcTransport) | Utility functions for working with JSON-RPC Transports.                                                                                                                                                                                           |

---
"ox": patch
---

Added optional `nonceKeys` to `eth_getTransactionCount` requests.

```ts
const nonce = await provider.request({
  method: 'eth_getTransactionCount',
  params: [address, 'pending', ['0x1', '0x2']],
})
```

---
"ox": minor
---

**Breaking (`ox/erc4337`):** `UserOperation.toRpc` dropped an EntryPoint 0.8 `authorization`; it now writes it as `eip7702Auth`, the field bundlers read (ERC-7769), and `UserOperation.fromRpc` reads it back. `UserOperation.RpcV08` has `eip7702Auth` in place of `authorization`.

```diff
 const rpc: UserOperation.RpcV08 = {
   // ...
-  authorization: { address, chainId: '0x1', nonce: '0x0', r, s, yParity: '0x0' },
+  eip7702Auth: { address, chainId: '0x1', nonce: '0x0', r, s, yParity: '0x0' },
 }
```

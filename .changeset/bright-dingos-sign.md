---
'ox': patch
---

Aligned native multisig wire formats, RPC shapes, signature constraints, and validation limits with Tempo's latest TIP-1061 implementation.

```diff
- { type: 'multisig', account, init?, signatures: ['0x...'] }
+ { account, signatures: [{ type: 'secp256k1', ... }] }
+ { init, signatures: [{ type: 'secp256k1', ... }] }
```

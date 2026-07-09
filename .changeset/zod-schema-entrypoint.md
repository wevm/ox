---
"ox": minor
---

Added the `ox/zod` entrypoint with module-scoped Zod schemas, direct integer quantity schemas, account proofs, authorizations, blocks, filters, override schemas, logs, RPC responses, RPC method schemas (`RpcSchema.Eth` / `RpcSchema.Wallet` per-method `params` / `returnType` plus `Request` envelopes), transaction envelopes, transactions, transaction requests, and transaction receipts. Added ABI, Solidity type-token, and EIP-712 Typed Data schemas compatible with ABIType's `abitype/zod` behavior.

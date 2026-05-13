---
"ox": minor
---

Added optional HTTP retry hooks (`retryCount`, `retryDelay`, `shouldRetry`) and `requestRaw` / `batch` helpers to `RpcTransport.fromHttp`, plus EIP-6963 `Provider.discover` / `Provider.announce` and a sibling `ProviderEvents` module that re-exports `createEmitter` for request-only consumers.

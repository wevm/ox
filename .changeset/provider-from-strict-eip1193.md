---
'ox': patch
---

Fixed `Provider.from` to stop sniffing successful EIP-1193 payloads for a `jsonrpc` field and reparsing them as JSON-RPC envelopes.

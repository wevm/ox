---
"ox": patch
---

`ox/tempo`: Added the `ReceivePolicyReceipt` module for encoding/decoding TIP-1028 receive-policy claim receipts (`ClaimReceiptV1` witnesses) with `decode`, `encode`, `from`, `fromLog`, and `fromTransactionReceipt` (returns one receipt per `TransferBlocked` log).

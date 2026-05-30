---
"ox": patch
---

`ox/tempo`: Added the `ReceivePolicyReceipt` module for decoding TIP-1028 receive-policy claim receipts (`ClaimReceiptV1` witnesses) with `decode`, `from`, and `fromTransactionReceipt` (returns one receipt per `TransferBlocked` log).

---
"ox": patch
---

Fixed `TypedData.assert` and `TypedData.validate` (and so `TypedData.getSignPayload` and `TypedData.serialize`) rejecting struct names that contain `:`, such as `HyperliquidTransaction:SendAsset`.

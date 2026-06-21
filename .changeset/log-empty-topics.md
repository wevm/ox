---
'ox': patch
---

Fixed the zod `Log` schema to accept logs with zero topics (e.g. `LOG0`/anonymous events) and widened `Log.topics` to `Hex.Hex[]`.

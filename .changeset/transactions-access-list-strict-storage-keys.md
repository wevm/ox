---
'ox': patch
---

Fixed `AccessList.fromTupleList` silently normalizing non-32-byte storage keys; it now throws `InvalidStorageKeySizeError` to match the symmetric `toTupleList` validation.

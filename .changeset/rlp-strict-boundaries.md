---
'ox': patch
---

Fixed RLP decoding to reject malformed payloads with trailing bytes (`Rlp.TrailingBytesError`) or list items overrunning the declared list length (`Rlp.ListBoundaryExceededError`).

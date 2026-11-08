---
"ox": patch
---

Fixed `Bytes.fromHex` and `Hex.toBytes` shifting the bytes of odd-length hex values when `size` was specified.

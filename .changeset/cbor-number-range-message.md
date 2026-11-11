---
"ox": patch
---

Fixed the `Cbor.NumberTooLargeError` message to state the integer range `Cbor.encode` supports (`-4294967296` to `4294967295`) instead of `Number.MAX_SAFE_INTEGER`.

---
"ox": minor
---

Fixed `Hex.toBigInt`, `Hex.toNumber`, `Bytes.toBigInt` and `Bytes.toNumber` throwing a `SyntaxError` (or a `NaN` range error) for empty input; empty hex and bytes now read as zero.

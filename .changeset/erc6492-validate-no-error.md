---
"ox": patch
---

Made `SignatureErc6492.validate` compare the magic suffix directly instead of calling `Hex.slice` inside a `try`, so a bundle that only validates no longer includes `Hex.slice`, its errors or `BaseError` (about 1 kB down to 140 B gzipped). The result is unchanged.

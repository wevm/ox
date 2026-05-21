---
'ox': patch
---

Fixed `SignatureErc6492.unwrap` to strip the trailing magic bytes before ABI-decoding, and made `SignatureErc6492.from` and `assert` validate object inputs by throwing the new `InvalidUnwrappedSignatureError` on malformed values.

---
"ox": patch
---

Fixed `SignatureErc6492.universalSignatureValidatorBytecode` to return `false` when `ecrecover` yields the zero address, so a malformed signature no longer verifies for the zero address.

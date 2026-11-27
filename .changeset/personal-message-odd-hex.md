---
"ox": patch
---

Fixed `PersonalMessage.encode` to throw `Hex.InvalidLengthError` for odd-length hex instead of returning a misaligned message.

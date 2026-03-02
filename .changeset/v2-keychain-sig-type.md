---
"ox": patch
---

**`ox/tempo`:** Added support for V2 keychain signature type (`0x04`) which binds the inner signature to the user account via `keccak256(0x04 || sigHash || userAddress)`.

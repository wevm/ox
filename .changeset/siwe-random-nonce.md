---
"ox": patch
---

Fixed `Siwe.generateNonce` to draw every nonce from `crypto.getRandomValues` instead of a sliding window over a `Math.random` buffer that made consecutive nonces share 95 of 96 characters.

---
"ox": patch
---

Made `Address.isEqual` check its inputs without bundling `Address.checksum` and keccak, which makes its bundle about 4x smaller.

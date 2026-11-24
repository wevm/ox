---
"ox": patch
---

Made `Base64.fromBytes` encode with `Uint8Array.prototype.toBase64` where the runtime has it (about 5x faster on Node 26), and `Base64.toBytes` decode without `TextEncoder` and a regular expression (about 6x faster). Invalid characters still decode as zero bits.

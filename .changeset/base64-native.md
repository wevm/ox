---
"ox": patch
---

Made `Base64.fromBytes` encode with `Uint8Array.prototype.toBase64` where the runtime has it (about 5x faster on Node 26), and `Base64.toBytes` decode without `TextEncoder` and a regular expression (about 6x faster). Valid input decodes as before. A character outside the Base64 alphabets now decodes as zero bits wherever it appears; before, one at the end of a group of four zeroed the group's three bytes, and a non-ASCII character counted once per UTF-8 byte.

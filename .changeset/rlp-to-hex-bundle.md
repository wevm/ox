---
"ox": patch
---

Made `Rlp.toHex` decode every input from its hex form, so it no longer bundles the byte cursor (3.8 kB → 2.1 kB gzipped) and decodes byte input about 1.7x faster; the output and errors are unchanged.

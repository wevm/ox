---
"ox": patch
---

Fixed webpack compatibility for `VirtualMaster` by making the `node:worker_threads` import specifier non-literal, preventing bundlers from statically analyzing and failing on the `node:` scheme.

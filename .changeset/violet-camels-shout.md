---
"ox": patch
---

Fixed the published package missing the `ox/_types/*` subpath: `zile publish:prepare` rebuilds `exports` and dropped the entry added in v1.3.0, so it now gets re-applied before publishing.

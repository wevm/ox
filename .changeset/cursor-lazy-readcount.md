---
"ox": patch
---

Deferred `Cursor.positionReadCount` `Map` allocation to the first `_touch()` call so single-pass cursors and cursors with `recursiveReadLimit: Number.POSITIVE_INFINITY` skip the per-instance allocation entirely.

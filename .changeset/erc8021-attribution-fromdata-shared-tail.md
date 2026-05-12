---
'ox': patch
---

Refactored `Attribution.fromData` to share the schema-0/1 `codes ∥ codesLength` tail-decode through a single helper, removing duplicated boundary arithmetic between schema branches.

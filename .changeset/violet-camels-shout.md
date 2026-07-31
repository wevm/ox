---
"ox": patch
---

Fixed the published package missing the `ox/_types/*` subpath: `postinstall` regenerates `exports` without it, and `zile publish:prepare` strips the `scripts` needed to re-apply it, so publishing now re-applies it directly before `changeset publish`.

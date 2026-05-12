---
"ox": patch
---

Made `Block.fromRpc` throw `Block.MissingFieldError` when a required Block field is absent and preserved `totalDifficulty` as `undefined` instead of silently coercing missing required fields and the optional `totalDifficulty` to `0n`.

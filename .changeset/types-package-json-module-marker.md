---
"ox": patch
---

Fixed missing `{"type":"module"}` marker in the emitted `_types/` folder so declaration files resolve correctly under TypeScript `node16`/`nodenext`.

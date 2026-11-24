---
"ox": patch
---

Improved tree-shaking of `ox/zod` modules with rolldown: an unused schema whose definition nests zod calls inside an object or array literal is now dropped instead of kept with its module.

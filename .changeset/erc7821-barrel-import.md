---
"ox": patch
---

Fixed `erc7821/Execute` importing the root `ox` barrel, which made importing `ox/erc7821` evaluate every ox module (and pull all of ox into CommonJS bundles).

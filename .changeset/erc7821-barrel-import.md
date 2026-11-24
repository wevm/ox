---
"ox": patch
---

Fixed `Execute` in `ox/erc7821` importing the root `ox` barrel, which made importing `ox/erc7821` load every ox module.

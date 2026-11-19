---
"ox": patch
---

Fixed the internal ENS module importing the root `ox` barrel, which made `Ens` pull in every ox module for CommonJS consumers.

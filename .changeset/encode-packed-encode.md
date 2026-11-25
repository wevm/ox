---
"ox": minor
---

**Breaking:** Removed `AbiParameters.encodePacked.encode`, a runtime namespace member that kept `encodePacked` (with `Address.assert` and keccak) in every bundle importing `AbiParameters`. `AbiParameters.format`, for example, drops from 5.9 kB to about 1.3 kB gzipped.

```diff
- AbiParameters.encodePacked.encode('uint8', 1)
+ AbiParameters.encodePacked(['uint8'], [1])
```

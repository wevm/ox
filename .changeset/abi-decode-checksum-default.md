---
"ox": major
---

**Breaking:** Changed ABI decode helpers to checksum decoded addresses by default.

```diff
- AbiParameters.decode(parameters, data)
+ AbiParameters.decode(parameters, data, { checksumAddress: false })
```

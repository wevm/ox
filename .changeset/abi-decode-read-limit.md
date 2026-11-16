---
"ox": patch
---

Tightened the `AbiParameters.decode` read size limit to twice the data size plus 32 bytes per allowed repeated read, so that offsets pointing many times at one region can no longer make the decoded value dozens of times larger than the data.

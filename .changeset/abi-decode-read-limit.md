---
"ox": patch
---

Tightened the `AbiParameters.decode` read size limit from 32 bytes per byte of data to two, keeping the allowance of 32 bytes per allowed repeated read (256 KiB by default), so that offsets pointing many times at one region can add at most that fixed allowance to the decoded value rather than up to 32 times the data size.

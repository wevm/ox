---
"ox": patch
---

Fixed `AccountSimulation.toRpc` passing through empty and 3-byte `keyData`, which the Tempo node rejects, by shimming them into a 2-byte length hint.

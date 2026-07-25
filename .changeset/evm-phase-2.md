---
"ox": minor
---

Added basic-block gas and stack validation to the `ox/evm` interpreter, making execution ~1.6-1.9x faster, and changed exceptional halts to consume all remaining gas.

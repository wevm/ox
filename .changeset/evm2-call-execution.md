---
"ox": minor
---

Added `ox/evm`, an EVM backed by `alloy-rs/evm2` compiled to WebAssembly, with read-only transaction execution; every operation reads its inputs when it is submitted, so mutating them afterwards cannot change what runs.

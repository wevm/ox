---
"ox": minor
---

Improved `tempo` `VirtualMaster.mineSaltAsync`: the single-threaded fallback (`workers: 1`, or environments without `Worker` / `worker_threads`) now runs the same WASM keccak256 loop as the worker pool on the main thread instead of the pure-JS implementation, and the default worker count uses `os.availableParallelism()` on Node/Bun/Deno instead of the browser-only `navigator.hardwareConcurrency` probe.

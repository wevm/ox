---
"ox": patch
---

Added TIP-1022 virtual address utilities to `ox/tempo`, including `VirtualAddress` helpers for formatting and parsing virtual addresses and `VirtualMaster` helpers for deriving registration hashes, validating salts, and mining bounded salt ranges.

Updated the Tempo virtual master helpers to reject invalid master addresses up front, including the zero address, virtual addresses, and TIP-20 token addresses.

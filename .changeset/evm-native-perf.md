---
"ox": patch
---

Made `ox/evm` execution substantially faster: the interpreter now keeps its stack pointer, gas, and code pointer in locals, replaces the top of the stack in place for two-input opcodes, and uses hardware 64x64 multiply and reciprocal division where the target provides them.

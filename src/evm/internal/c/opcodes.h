// Per-opcode metadata driving basic-block analysis.
//
// `gas` is the *static* base cost only. Opcodes with a size-dependent
// component (EXP, KECCAK256, the copies, and anything touching memory) charge
// the remainder inline in the interpreter.

#ifndef OX_EVM_OPCODES_H
#define OX_EVM_OPCODES_H

#include "u256.h"

/** Opcode is defined and implemented. */
#define OP_VALID 1
/** Opcode ends a basic block: control leaves, or execution halts. */
#define OP_TERMINATOR 2

typedef struct {
  uint16_t gas;
  uint8_t pops;
  uint8_t pushes;
  uint8_t flags;
} op_info;

#define OP(gas, pops, pushes) {(gas), (pops), (pushes), OP_VALID}
#define OP_END(gas, pops, pushes) \
  {(gas), (pops), (pushes), OP_VALID | OP_TERMINATOR}

// Anything not listed is `{0, 0, 0, 0}` — undefined, which analysis treats as
// a block terminator so the block's gas stops accumulating there, and which
// the interpreter rejects with `EVM_INVALID_OPCODE`.
static const op_info op_table[256] = {
    [0x00] = OP_END(0, 0, 0),  // STOP

    [0x01] = OP(3, 2, 1),      // ADD
    [0x02] = OP(5, 2, 1),      // MUL
    [0x03] = OP(3, 2, 1),      // SUB
    [0x04] = OP(5, 2, 1),      // DIV
    [0x05] = OP(5, 2, 1),      // SDIV
    [0x06] = OP(5, 2, 1),      // MOD
    [0x07] = OP(5, 2, 1),      // SMOD
    [0x08] = OP(8, 3, 1),      // ADDMOD
    [0x09] = OP(8, 3, 1),      // MULMOD
    [0x0a] = OP(10, 2, 1),     // EXP        (+50 per exponent byte)
    [0x0b] = OP(5, 2, 1),      // SIGNEXTEND

    [0x10] = OP(3, 2, 1),      // LT
    [0x11] = OP(3, 2, 1),      // GT
    [0x12] = OP(3, 2, 1),      // SLT
    [0x13] = OP(3, 2, 1),      // SGT
    [0x14] = OP(3, 2, 1),      // EQ
    [0x15] = OP(3, 1, 1),      // ISZERO
    [0x16] = OP(3, 2, 1),      // AND
    [0x17] = OP(3, 2, 1),      // OR
    [0x18] = OP(3, 2, 1),      // XOR
    [0x19] = OP(3, 1, 1),      // NOT
    [0x1a] = OP(3, 2, 1),      // BYTE
    [0x1b] = OP(3, 2, 1),      // SHL
    [0x1c] = OP(3, 2, 1),      // SHR
    [0x1d] = OP(3, 2, 1),      // SAR

    [0x20] = OP(30, 2, 1),     // KECCAK256  (+6 per word, + memory)

    [0x35] = OP(3, 1, 1),      // CALLDATALOAD
    [0x36] = OP(2, 0, 1),      // CALLDATASIZE
    [0x37] = OP(3, 3, 0),      // CALLDATACOPY (+3 per word, + memory)
    [0x38] = OP(2, 0, 1),      // CODESIZE
    [0x39] = OP(3, 3, 0),      // CODECOPY     (+3 per word, + memory)
    [0x3a] = OP(2, 0, 1),      // GASPRICE
    [0x3b] = OP(0, 1, 1),      // EXTCODESIZE  (warm/cold)
    [0x3c] = OP(0, 4, 0),      // EXTCODECOPY  (warm/cold, +3 per word, + memory)
    [0x3d] = OP(2, 0, 1),      // RETURNDATASIZE
    [0x3e] = OP(3, 3, 0),      // RETURNDATACOPY (+3 per word, + memory)
    [0x3f] = OP(0, 1, 1),      // EXTCODEHASH  (warm/cold)

    [0x40] = OP(20, 1, 1),     // BLOCKHASH
    [0x41] = OP(2, 0, 1),      // COINBASE
    [0x42] = OP(2, 0, 1),      // TIMESTAMP
    [0x43] = OP(2, 0, 1),      // NUMBER
    [0x44] = OP(2, 0, 1),      // PREVRANDAO
    [0x45] = OP(2, 0, 1),      // GASLIMIT
    [0x46] = OP(2, 0, 1),      // CHAINID
    [0x47] = OP(5, 0, 1),      // SELFBALANCE
    [0x48] = OP(2, 0, 1),      // BASEFEE
    [0x49] = OP(3, 1, 1),      // BLOBHASH
    [0x4a] = OP(2, 0, 1),      // BLOBBASEFEE

    [0x50] = OP(2, 1, 0),      // POP
    [0x51] = OP(3, 1, 1),      // MLOAD        (+ memory)
    [0x52] = OP(3, 2, 0),      // MSTORE       (+ memory)
    [0x53] = OP(3, 2, 0),      // MSTORE8      (+ memory)
    [0x54] = OP(0, 1, 1),      // SLOAD        (warm/cold)
    [0x55] = OP(0, 2, 0),      // SSTORE       (EIP-2200/3529)
    [0x56] = OP_END(8, 1, 0),  // JUMP
    [0x57] = OP_END(10, 2, 0), // JUMPI
    [0x58] = OP(2, 0, 1),      // PC
    [0x59] = OP(2, 0, 1),      // MSIZE
    [0x5a] = OP(2, 0, 1),      // GAS
    [0x5b] = OP(1, 0, 0),      // JUMPDEST
    [0x5c] = OP(100, 1, 1),    // TLOAD
    [0x5d] = OP(100, 2, 0),    // TSTORE
    [0x5e] = OP(3, 3, 0),      // MCOPY        (+3 per word, + memory)
    [0x5f] = OP(2, 0, 1),      // PUSH0

    [0x60] = OP(3, 0, 1), [0x61] = OP(3, 0, 1), [0x62] = OP(3, 0, 1),
    [0x63] = OP(3, 0, 1), [0x64] = OP(3, 0, 1), [0x65] = OP(3, 0, 1),
    [0x66] = OP(3, 0, 1), [0x67] = OP(3, 0, 1), [0x68] = OP(3, 0, 1),
    [0x69] = OP(3, 0, 1), [0x6a] = OP(3, 0, 1), [0x6b] = OP(3, 0, 1),
    [0x6c] = OP(3, 0, 1), [0x6d] = OP(3, 0, 1), [0x6e] = OP(3, 0, 1),
    [0x6f] = OP(3, 0, 1), [0x70] = OP(3, 0, 1), [0x71] = OP(3, 0, 1),
    [0x72] = OP(3, 0, 1), [0x73] = OP(3, 0, 1), [0x74] = OP(3, 0, 1),
    [0x75] = OP(3, 0, 1), [0x76] = OP(3, 0, 1), [0x77] = OP(3, 0, 1),
    [0x78] = OP(3, 0, 1), [0x79] = OP(3, 0, 1), [0x7a] = OP(3, 0, 1),
    [0x7b] = OP(3, 0, 1), [0x7c] = OP(3, 0, 1), [0x7d] = OP(3, 0, 1),
    [0x7e] = OP(3, 0, 1), [0x7f] = OP(3, 0, 1), // PUSH1..PUSH32

    // DUP<n> reads the n-th item and pushes a copy: n inputs, n+1 outputs.
    [0x80] = OP(3, 1, 2),   [0x81] = OP(3, 2, 3),   [0x82] = OP(3, 3, 4),
    [0x83] = OP(3, 4, 5),   [0x84] = OP(3, 5, 6),   [0x85] = OP(3, 6, 7),
    [0x86] = OP(3, 7, 8),   [0x87] = OP(3, 8, 9),   [0x88] = OP(3, 9, 10),
    [0x89] = OP(3, 10, 11), [0x8a] = OP(3, 11, 12), [0x8b] = OP(3, 12, 13),
    [0x8c] = OP(3, 13, 14), [0x8d] = OP(3, 14, 15), [0x8e] = OP(3, 15, 16),
    [0x8f] = OP(3, 16, 17), // DUP1..DUP16

    // SWAP<n> touches n+1 items and leaves the height unchanged.
    [0x90] = OP(3, 2, 2),   [0x91] = OP(3, 3, 3),   [0x92] = OP(3, 4, 4),
    [0x93] = OP(3, 5, 5),   [0x94] = OP(3, 6, 6),   [0x95] = OP(3, 7, 7),
    [0x96] = OP(3, 8, 8),   [0x97] = OP(3, 9, 9),   [0x98] = OP(3, 10, 10),
    [0x99] = OP(3, 11, 11), [0x9a] = OP(3, 12, 12), [0x9b] = OP(3, 13, 13),
    [0x9c] = OP(3, 14, 14), [0x9d] = OP(3, 15, 15), [0x9e] = OP(3, 16, 16),
    [0x9f] = OP(3, 17, 17), // SWAP1..SWAP16

    // LOG<n>: 375 base plus 375 per topic, charged statically; the per-byte
    // component and memory expansion are inline.
    [0xa0] = OP(375, 2, 0),    // LOG0
    [0xa1] = OP(750, 3, 0),    // LOG1
    [0xa2] = OP(1125, 4, 0),   // LOG2
    [0xa3] = OP(1500, 5, 0),   // LOG3
    [0xa4] = OP(1875, 6, 0),   // LOG4

    // The call family ends a block: gas and stack effects past the call
    // depend on its result.
    [0xf0] = OP_END(0, 3, 1),  // CREATE
    [0xf1] = OP_END(0, 7, 1),  // CALL
    [0xf2] = OP_END(0, 7, 1),  // CALLCODE
    [0xf4] = OP_END(0, 6, 1),  // DELEGATECALL
    [0xf5] = OP_END(0, 4, 1),  // CREATE2
    [0xfa] = OP_END(0, 6, 1),  // STATICCALL

    [0xf3] = OP_END(0, 2, 0),  // RETURN (+ memory)
    [0xfd] = OP_END(0, 2, 0),  // REVERT (+ memory)
    [0xfe] = OP_END(0, 0, 0),  // INVALID: defined, and always halts
    [0xff] = OP_END(5000, 1, 0), // SELFDESTRUCT (EIP-6780)
};

#undef OP
#undef OP_END

#endif  // OX_EVM_OPCODES_H

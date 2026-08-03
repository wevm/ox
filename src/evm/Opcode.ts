import type * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'

/** Opcode name to byte value, covering the Osaka instruction set. */
export const codes = {
  STOP: 0x00,
  ADD: 0x01,
  MUL: 0x02,
  SUB: 0x03,
  DIV: 0x04,
  SDIV: 0x05,
  MOD: 0x06,
  SMOD: 0x07,
  ADDMOD: 0x08,
  MULMOD: 0x09,
  EXP: 0x0a,
  SIGNEXTEND: 0x0b,

  LT: 0x10,
  GT: 0x11,
  SLT: 0x12,
  SGT: 0x13,
  EQ: 0x14,
  ISZERO: 0x15,
  AND: 0x16,
  OR: 0x17,
  XOR: 0x18,
  NOT: 0x19,
  BYTE: 0x1a,
  SHL: 0x1b,
  SHR: 0x1c,
  SAR: 0x1d,
  CLZ: 0x1e,

  KECCAK256: 0x20,

  ADDRESS: 0x30,
  BALANCE: 0x31,
  ORIGIN: 0x32,
  CALLER: 0x33,
  CALLVALUE: 0x34,
  CALLDATALOAD: 0x35,
  CALLDATASIZE: 0x36,
  CALLDATACOPY: 0x37,
  CODESIZE: 0x38,
  CODECOPY: 0x39,
  GASPRICE: 0x3a,
  EXTCODESIZE: 0x3b,
  EXTCODECOPY: 0x3c,
  RETURNDATASIZE: 0x3d,
  RETURNDATACOPY: 0x3e,
  EXTCODEHASH: 0x3f,

  BLOCKHASH: 0x40,
  COINBASE: 0x41,
  TIMESTAMP: 0x42,
  NUMBER: 0x43,
  PREVRANDAO: 0x44,
  GASLIMIT: 0x45,
  CHAINID: 0x46,
  SELFBALANCE: 0x47,
  BASEFEE: 0x48,
  BLOBHASH: 0x49,
  BLOBBASEFEE: 0x4a,

  POP: 0x50,
  MLOAD: 0x51,
  MSTORE: 0x52,
  MSTORE8: 0x53,
  SLOAD: 0x54,
  SSTORE: 0x55,
  JUMP: 0x56,
  JUMPI: 0x57,
  PC: 0x58,
  MSIZE: 0x59,
  GAS: 0x5a,
  JUMPDEST: 0x5b,
  TLOAD: 0x5c,
  TSTORE: 0x5d,
  MCOPY: 0x5e,
  PUSH0: 0x5f,

  PUSH1: 0x60,
  PUSH2: 0x61,
  PUSH3: 0x62,
  PUSH4: 0x63,
  PUSH5: 0x64,
  PUSH6: 0x65,
  PUSH7: 0x66,
  PUSH8: 0x67,
  PUSH9: 0x68,
  PUSH10: 0x69,
  PUSH11: 0x6a,
  PUSH12: 0x6b,
  PUSH13: 0x6c,
  PUSH14: 0x6d,
  PUSH15: 0x6e,
  PUSH16: 0x6f,
  PUSH17: 0x70,
  PUSH18: 0x71,
  PUSH19: 0x72,
  PUSH20: 0x73,
  PUSH21: 0x74,
  PUSH22: 0x75,
  PUSH23: 0x76,
  PUSH24: 0x77,
  PUSH25: 0x78,
  PUSH26: 0x79,
  PUSH27: 0x7a,
  PUSH28: 0x7b,
  PUSH29: 0x7c,
  PUSH30: 0x7d,
  PUSH31: 0x7e,
  PUSH32: 0x7f,

  DUP1: 0x80,
  DUP2: 0x81,
  DUP3: 0x82,
  DUP4: 0x83,
  DUP5: 0x84,
  DUP6: 0x85,
  DUP7: 0x86,
  DUP8: 0x87,
  DUP9: 0x88,
  DUP10: 0x89,
  DUP11: 0x8a,
  DUP12: 0x8b,
  DUP13: 0x8c,
  DUP14: 0x8d,
  DUP15: 0x8e,
  DUP16: 0x8f,

  SWAP1: 0x90,
  SWAP2: 0x91,
  SWAP3: 0x92,
  SWAP4: 0x93,
  SWAP5: 0x94,
  SWAP6: 0x95,
  SWAP7: 0x96,
  SWAP8: 0x97,
  SWAP9: 0x98,
  SWAP10: 0x99,
  SWAP11: 0x9a,
  SWAP12: 0x9b,
  SWAP13: 0x9c,
  SWAP14: 0x9d,
  SWAP15: 0x9e,
  SWAP16: 0x9f,

  LOG0: 0xa0,
  LOG1: 0xa1,
  LOG2: 0xa2,
  LOG3: 0xa3,
  LOG4: 0xa4,

  CREATE: 0xf0,
  CALL: 0xf1,
  CALLCODE: 0xf2,
  RETURN: 0xf3,
  DELEGATECALL: 0xf4,
  CREATE2: 0xf5,
  STATICCALL: 0xfa,
  REVERT: 0xfd,
  INVALID: 0xfe,
  SELFDESTRUCT: 0xff,
} as const

/** An opcode name. */
export type Name = keyof typeof codes

const names = /*#__PURE__*/ (() => {
  const table = Array.from<Name | undefined>({ length: 256 })
  for (const name of Object.keys(codes) as readonly Name[])
    table[codes[name]] = name
  return table
})()

/**
 * Returns the mnemonic for an opcode byte, or `undefined` if it is undefined
 * in the Osaka instruction set.
 *
 * @example
 * ```ts twoslash
 * import { Opcode } from 'ox/evm'
 *
 * Opcode.toName(0x01)
 * // @log: 'ADD'
 * ```
 *
 * @param code - Opcode byte.
 * @returns The mnemonic, or `undefined`.
 */
export function toName(code: number): Name | undefined {
  if (code < 0 || code > 0xff) return undefined
  return names[code]
}

export declare namespace toName {
  type ErrorType = Errors.GlobalErrorType
}

/** A single decoded instruction. */
export type Instruction = {
  /** Byte offset of the opcode within the bytecode. */
  readonly offset: number
  /** Opcode byte. */
  readonly code: number
  /** Mnemonic, or `undefined` for an undefined opcode. */
  readonly name: Name | undefined
  /** Immediate operand for `PUSH1`–`PUSH32`, right-zero-padded if truncated. */
  readonly push?: Hex.Hex | undefined
}

/**
 * Disassembles bytecode into instructions, skipping `PUSH` immediates the same
 * way jumpdest analysis does.
 *
 * @example
 * ```ts twoslash
 * import { Opcode } from 'ox/evm'
 *
 * Opcode.disassemble('0x6001600201')
 * // @log: [
 * // @log:   { offset: 0, code: 0x60, name: 'PUSH1', push: '0x01' },
 * // @log:   { offset: 2, code: 0x60, name: 'PUSH1', push: '0x02' },
 * // @log:   { offset: 4, code: 0x01, name: 'ADD' },
 * // @log: ]
 * ```
 *
 * @param bytecode - Bytecode to disassemble.
 * @returns The decoded instructions.
 */
export function disassemble(
  bytecode: Hex.Hex | Uint8Array,
): readonly Instruction[] {
  const bytes = typeof bytecode === 'string' ? Hex.toBytes(bytecode) : bytecode
  const out: Instruction[] = []
  for (let i = 0; i < bytes.length; ) {
    const code = bytes[i] as number
    const name = toName(code)
    if (code >= 0x60 && code <= 0x7f) {
      const size = code - 0x5f
      const data = bytes.slice(i + 1, i + 1 + size)
      // A truncated immediate is right-zero-padded, matching execution.
      const padded =
        data.length === size
          ? data
          : (() => {
              const buf = new Uint8Array(size)
              buf.set(data, 0)
              return buf
            })()
      out.push({ offset: i, code, name, push: Hex.fromBytes(padded) })
      i += 1 + size
    } else {
      out.push({ offset: i, code, name })
      i += 1
    }
  }
  return out
}

export declare namespace disassemble {
  type ErrorType = Hex.toBytes.ErrorType | Errors.GlobalErrorType
}

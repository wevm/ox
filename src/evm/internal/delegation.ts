import * as Hex from '../../core/Hex.js'

/** Returns the address in a complete EIP-7702 delegation designator. */
export function getAddress(code: Uint8Array): string | undefined {
  if (
    code.length !== 23 ||
    code[0] !== 0xef ||
    code[1] !== 0x01 ||
    code[2] !== 0x00
  )
    return undefined
  return Hex.fromBytes(code.subarray(3))
}

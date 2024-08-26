import { Address_from } from '../address/from.js'
import type { Address } from '../address/types.js'
import { Bytes_concat } from '../bytes/concat.js'
import { Bytes_from } from '../bytes/from.js'
import { Bytes_isBytes } from '../bytes/isBytes.js'
import { Bytes_padLeft } from '../bytes/pad.js'
import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hash_keccak256 } from '../hash/keccak256.js'
import { Hex_slice } from '../hex/slice.js'
import type { Hex } from '../hex/types.js'

/**
 * Generates contract address via [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode.
 *
 * - Docs: https://oxlib.sh/api/contractAddress/getCreate2Address
 * - Spec: https://eips.ethereum.org/EIPS/eip-1014
 *
 * @example
 * ```ts twoslash
 * import { Bytes, ContractAddress, Hex } from 'ox'
 *
 * ContractAddress.getCreate2Address({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   bytecode: Bytes.from('0x6394198df16000526103ff60206004601c335afa6040516060f3'),
 *   salt: Hex.from('hello world'),
 * })
 * // '0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB'
 * ```
 */
export function ContractAddress_getCreate2Address(
  opts: ContractAddress_getCreate2Address.Options,
) {
  const from = Bytes_from(Address_from(opts.from))
  const salt = Bytes_padLeft(
    Bytes_isBytes(opts.salt) ? opts.salt : Bytes_from(opts.salt),
    32,
  )

  const bytecodeHash = (() => {
    if ('bytecodeHash' in opts) {
      if (Bytes_isBytes(opts.bytecodeHash)) return opts.bytecodeHash
      return Bytes_from(opts.bytecodeHash)
    }
    return Hash_keccak256(opts.bytecode, 'Bytes')
  })()

  return Address_from(
    Hex_slice(
      Hash_keccak256(
        Bytes_concat(Bytes_from('0xff'), from, salt, bytecodeHash),
      ),
      12,
    ),
  )
}

export declare namespace ContractAddress_getCreate2Address {
  type Options =
    | {
        bytecode: Bytes | Hex
        from: Address
        salt: Bytes | Hex
      }
    | {
        bytecodeHash: Bytes | Hex
        from: Address
        salt: Bytes | Hex
      }

  type ErrorType =
    | Address_from.ErrorType
    | Bytes_concat.ErrorType
    | Bytes_isBytes.ErrorType
    | Bytes_padLeft.ErrorType
    | Hash_keccak256.ErrorType
    | Hex_slice.ErrorType
    | Bytes_from.ErrorType
    | GlobalErrorType
}

ContractAddress_getCreate2Address.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as ContractAddress_getCreate2Address.ErrorType

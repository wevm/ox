import { Address_from } from '../Address/from.js'
import type { Address } from '../Address/types.js'
import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import { Bytes_isBytes } from '../Bytes/isBytes.js'
import { Bytes_padLeft } from '../Bytes/pad.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'

/**
 * Generates contract address via [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, ContractAddress, Hex } from 'ox'
 *
 * ContractAddress.getCreate2Address({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   bytecode: Bytes.from('0x6394198df16000526103ff60206004601c335afa6040516060f3'),
 *   salt: Hex.fromString('hello world'),
 * })
 * // @log: '0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB'
 * ```
 *
 * @param options - Options for retrieving address.
 * @returns Contract Address.
 */
export function ContractAddress_getCreate2Address(
  options: ContractAddress_getCreate2Address.Options,
): Address {
  const from = Bytes_fromHex(Address_from(options.from))
  const salt = Bytes_padLeft(
    Bytes_isBytes(options.salt) ? options.salt : Bytes_fromHex(options.salt),
    32,
  )

  const bytecodeHash = (() => {
    if ('bytecodeHash' in options) {
      if (Bytes_isBytes(options.bytecodeHash)) return options.bytecodeHash
      return Bytes_fromHex(options.bytecodeHash)
    }
    return Hash_keccak256(options.bytecode, { as: 'Bytes' })
  })()

  return Address_from(
    Hex_slice(
      Hash_keccak256(
        Bytes_concat(Bytes_fromHex('0xff'), from, salt, bytecodeHash),
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
    | Bytes_fromHex.ErrorType
    | GlobalErrorType
}

ContractAddress_getCreate2Address.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as ContractAddress_getCreate2Address.ErrorType

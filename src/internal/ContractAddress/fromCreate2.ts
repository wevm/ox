import * as Address from '../../Address.js'
import * as Bytes from '../../Bytes.js'
import type * as ContractAddress from '../../ContractAddress.js'
import type * as Errors from '../../Errors.js'
import * as Hash from '../../Hash.js'
import * as Hex from '../../Hex.js'

/**
 * Computes contract address via [CREATE2](https://eips.ethereum.org/EIPS/eip-1014) opcode.
 *
 * @example
 * ```ts twoslash
 * import { ContractAddress, Hex } from 'ox'
 *
 * ContractAddress.fromCreate2({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   bytecode: '0x6394198df16000526103ff60206004601c335afa6040516060f3',
 *   salt: Hex.fromString('hello world'),
 * })
 * // @log: '0x59fbB593ABe27Cb193b6ee5C5DC7bbde312290aB'
 * ```
 *
 * @param options - Options for retrieving address.
 * @returns Contract Address.
 */
export function fromCreate2(
  options: ContractAddress.fromCreate2.Options,
): Address.Address {
  const from = Bytes.fromHex(Address.from(options.from))
  const salt = Bytes.padLeft(
    Bytes.validate(options.salt) ? options.salt : Bytes.fromHex(options.salt),
    32,
  )

  const bytecodeHash = (() => {
    if ('bytecodeHash' in options) {
      if (Bytes.validate(options.bytecodeHash)) return options.bytecodeHash
      return Bytes.fromHex(options.bytecodeHash)
    }
    return Hash.keccak256(options.bytecode, { as: 'Bytes' })
  })()

  return Address.from(
    Hex.slice(
      Hash.keccak256(
        Bytes.concat(Bytes.fromHex('0xff'), from, salt, bytecodeHash),
        {
          as: 'Hex',
        },
      ),
      12,
    ),
  )
}

export declare namespace fromCreate2 {
  type Options =
    | {
        bytecode: Bytes.Bytes | Hex.Hex
        from: Address.Address
        salt: Bytes.Bytes | Hex.Hex
      }
    | {
        bytecodeHash: Bytes.Bytes | Hex.Hex
        from: Address.Address
        salt: Bytes.Bytes | Hex.Hex
      }

  type ErrorType =
    | Address.from.ErrorType
    | Bytes.concat.ErrorType
    | Bytes.validate.ErrorType
    | Bytes.padLeft.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.slice.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

fromCreate2.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromCreate2.ErrorType

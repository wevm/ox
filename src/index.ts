/**
 * The **Abi** Module provides a set of utility functions for encoding, decoding,
 * and working with [Application Binary Interfaces (ABIs)](https://docs.soliditylang.org/en/latest/abi-spec.html).
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const data = Abi.encodeParameters(
 *   ['uint256', 'boolean', 'string'],
 *   [1n, true, 'hello'],
 * )
 * // @log: '0x...'

 * const args = Abi.decodeParameters(['uint256', 'boolean', 'string'], data)
 * // @log: [1n, true, 'hello']
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const selector = Abi.getSelector('approve(address,uint256)')
 * // @log: '0x095ea7b3'
 * ```
 */
export * as Abi from './Abi.js'

/**
 * The **Address** Module provides a set of utility functions for working with Ethereum addresses.
 */
export * as Address from './Address.js'

/**
 * The **Authorization** Module provides a set of utility functions for working with
 * [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization lists & tuples.
 */
export * as Authorization from './Authorization.js'

/**
 * The **Blobs** Module provides a set of utility functions for working with
 * [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Blobs.
 */
export * as Blobs from './Blobs.js'

/**
 * The **Bytes** Module provides a set of Ethereum-related utility functions for
 * working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances.
 */
export * as Bytes from './Bytes.js'

export * as Caches from './Caches.js'

export * as Constants from './Constants.js'

/**
 * The **ContractAddress** Module provides a set of utility functions for computing
 * Contract Addresses.
 */
export * as ContractAddress from './ContractAddress.js'

export * as Errors from './Errors.js'

/**
 * The **Hash** Module provides a set of utility functions for hashing.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * const value = Hash.keccak256('0xdeadbeef')
 * // '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
 * ```
 */
export * as Hash from './Hash.js'

/**
 * The **Hex** Module provides a set of Ethereum-related utility functions
 * for working with hexadecimal string values (e.g. `"0xdeadbeef"`).
 */
export * as Hex from './Hex.js'

export * as Internal from './Internal.js'

/**
 * The **Kzg** Module provides a set of utility functions for working with
 * KZG Commitments.
 * Mainly for [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Blobs.
 */
export * as Kzg from './Kzg.js'

/**
 * The **Rlp** Module provides a set of utility functions for encoding and decoding [Recursive Length Prefix](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) structures.
 *
 * @example
 * ```ts twoslash
 * import { Hex, Rlp } from 'ox'
 *
 * const data = Rlp.fromHex([Hex.from('hello'), Hex.from('world')])
 * // @log: '0xcc8568656c6c6f85776f726c64'
 *
 * const values = Rlp.toHex(data)
 * // @log: [Hex.from('hello'), Hex.from('world')]
 * ```
 */
export * as Rlp from './Rlp.js'

/**
 * The **Secp256k1** Module provides a set of utility functions for secp256k1 cryptography.
 */
export * as Secp256k1 from './Secp256k1.js'

/**
 * The **Signature** Module provides a set of utility functions for working with ECDSA signatures.
 */
export * as Signature from './Signature.js'

/**
 * The **Siwe** Module provides a set of utility functions for working with
 * [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361).
 */
export * as Siwe from './Siwe.js'

/**
 * The **TransactionEnvelope** Module provides a set of utility functions for working
 * with **Legacy Transaction Envelopes** & [EIP-2718 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-2718).
 */
export * as TransactionEnvelope from './TransactionEnvelope.js'

/**
 * The **TransactionEnvelopeLegacy** Module provides a set of utility functions for working
 * with **Legacy Transaction Envelopes**.
 */
export * as TransactionEnvelopeLegacy from './TransactionEnvelopeLegacy.js'

/**
 * The **TransactionEnvelopeEip1559** Module provides a set of utility functions for working
 * with [EIP-1559 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-1559).
 */
export * as TransactionEnvelopeEip1559 from './TransactionEnvelopeEip1559.js'

/**
 * The **TransactionEnvelopeEip2930** Module provides a set of utility functions for working
 * with [EIP-2930 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-2930).
 */
export * as TransactionEnvelopeEip2930 from './TransactionEnvelopeEip2930.js'

/**
 * The **TransactionEnvelopeEip4844** Module provides a set of utility functions for working
 * with [EIP-4844 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-4844).
 */
export * as TransactionEnvelopeEip4844 from './TransactionEnvelopeEip4844.js'

/**
 * The **TransactionEnvelopeEip7702** Module provides a set of utility functions for working
 * with [EIP-7702 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-7702).
 */
export * as TransactionEnvelopeEip7702 from './TransactionEnvelopeEip7702.js'

/**
 * The **TypedData** Module provides a set of utility functions for working
 * with [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).
 */
export * as TypedData from './TypedData.js'

export * as Types from './Types.js'

/**
 * The **Value** Module provides a set of utility functions for displaying and parsing Ethereum Values as defined under **2.1. Value** in the [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Value } from 'ox'
 *
 * const value = Value.fromEther('1')
 * // @log: 1_000_000_000_000_000_000n
 *
 * const formattedValue = Value.formatEther(value)
 * // @log: '1'
 *
 * const value = Value.fromEther('1', 'szabo')
 * // @log: 1_000_000n
 * ```
 */
export * as Value from './Value.js'

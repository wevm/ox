import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute, Mutable } from '../core/internal/types.js'
import * as Rlp from '../core/Rlp.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

/**
 * Root type for a Tempo Authorization.
 *
 * Tempo extends EIP-7702 to support secp256k1, P256, and WebAuthn signature types,
 * enabling passkey-based account delegation.
 *
 * [Tempo Authorization Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#tempo-authorization-list)
 */
export type AuthorizationTempo<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** Address of the contract to set as code for the Authority. */
    address: Address.Address
    /** Chain ID to authorize. */
    chainId: numberType
    /** Nonce of the Authority to authorize. */
    nonce: bigintType
  } & (signed extends true
    ? { signature: SignatureEnvelope.SignatureEnvelope<bigintType, numberType> }
    : {
        signature?:
          | SignatureEnvelope.SignatureEnvelope<bigintType, numberType>
          | undefined
      })
>

/** RPC representation of an {@link ox#AuthorizationTempo.AuthorizationTempo}. */
export type Rpc = Omit<
  AuthorizationTempo<false, Hex.Hex, Hex.Hex>,
  'signature'
> & {
  signature: SignatureEnvelope.SignatureEnvelopeRpc
}

/** List of {@link ox#AuthorizationTempo.AuthorizationTempo}. */
export type List<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<readonly AuthorizationTempo<signed, bigintType, numberType>[]>

/** RPC representation of a list of AA Authorizations. */
export type ListRpc = readonly Rpc[]

/** Signed representation of a list of AA Authorizations. */
export type ListSigned<bigintType = bigint, numberType = number> = List<
  true,
  bigintType,
  numberType
>

/** Signed representation of an AA Authorization. */
export type Signed<
  bigintType = bigint,
  numberType = number,
> = AuthorizationTempo<true, bigintType, numberType>

/** Tuple representation of an AA Authorization. */
export type Tuple<signed extends boolean = boolean> = signed extends true
  ? readonly [
      chainId: Hex.Hex,
      address: Hex.Hex,
      nonce: Hex.Hex,
      signature: Hex.Hex,
    ]
  : readonly [chainId: Hex.Hex, address: Hex.Hex, nonce: Hex.Hex]

/** Tuple representation of a signed {@link ox#AuthorizationTempo.AuthorizationTempo}. */
export type TupleSigned = Tuple<true>

/** Tuple representation of a list of {@link ox#AuthorizationTempo.AuthorizationTempo}. */
export type TupleList<signed extends boolean = boolean> =
  readonly Tuple<signed>[]

/** Tuple representation of a list of signed {@link ox#AuthorizationTempo.AuthorizationTempo}. */
export type TupleListSigned = TupleList<true>

/**
 * Converts an EIP-7702 Authorization object into a typed {@link ox#AuthorizationTempo.AuthorizationTempo}.
 *
 * Tempo extends EIP-7702 to support secp256k1, P256, and WebAuthn signature types.
 *
 * [Tempo Authorization Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#tempo-authorization-list)
 *
 * @example
 * An Authorization can be instantiated from an EIP-7702 Authorization tuple in object format.
 *
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures (Secp256k1)
 *
 * Standard Ethereum ECDSA signature using the secp256k1 curve.
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: AuthorizationTempo.getSignPayload(authorization),
 *   privateKey,
 * })
 *
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature }, // [!code focus]
 * )
 * ```
 *
 * @example
 * ### Attaching Signatures (P256)
 *
 * ECDSA signature using the P-256 (secp256r1) curve. Requires embedding the
 * public key and a `prehash` flag indicating whether the payload was hashed
 * before signing.
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const { privateKey, publicKey } = P256.createKeyPair()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const signature = P256.sign({
 *   payload: AuthorizationTempo.getSignPayload(authorization),
 *   privateKey,
 * })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   signature,
 *   publicKey,
 *   prehash: false,
 * })
 *
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }, // [!code focus]
 * )
 * ```
 *
 * @example
 * ### Attaching Signatures (P256 WebCrypto)
 *
 * When using WebCrypto keys, `prehash` must be `true` since WebCrypto always
 * hashes the payload internally before signing.
 *
 * ```ts twoslash
 * // @noErrors
 * import { WebCryptoP256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const signature = await WebCryptoP256.sign({
 *   payload: AuthorizationTempo.getSignPayload(authorization),
 *   privateKey,
 * })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   signature,
 *   publicKey,
 *   prehash: true,
 * })
 *
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }, // [!code focus]
 * )
 * ```
 *
 * @example
 * ### Attaching Signatures (WebAuthn)
 *
 * Passkey-based signature using WebAuthn. Includes authenticator metadata
 * (authenticatorData and clientDataJSON) along with the P-256 signature and
 * public key.
 *
 * ```ts twoslash
 * // @noErrors
 * import { WebAuthnP256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const credential = await WebAuthnP256.createCredential({ name: 'Example' })
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   challenge: AuthorizationTempo.getSignPayload(authorization),
 *   credentialId: credential.id,
 * })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   signature,
 *   publicKey: credential.publicKey,
 *   metadata,
 * })
 *
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }, // [!code focus]
 * )
 * ```
 *
 * @param authorization - An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) AA Authorization tuple in object format.
 * @param options - AA Authorization options.
 * @returns The {@link ox#AuthorizationTempo.AuthorizationTempo}.
 */
export function from<
  const authorization extends AuthorizationTempo | Rpc,
  const signature extends SignatureEnvelope.from.Value | undefined = undefined,
>(
  authorization: authorization | AuthorizationTempo,
  options: from.Options<signature> = {},
): from.ReturnType<authorization, signature> {
  if (typeof authorization.chainId === 'string')
    return fromRpc(authorization as Rpc) as never
  if (options.signature) {
    return { ...authorization, signature: options.signature } as never
  }
  return authorization as never
}

export declare namespace from {
  type Options<
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = {
    /** The {@link ox#SignatureEnvelope.SignatureEnvelope} to attach to the AA Authorization. */
    signature?: signature | SignatureEnvelope.SignatureEnvelope | undefined
  }

  type ReturnType<
    authorization extends AuthorizationTempo | Rpc = AuthorizationTempo,
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = Compute<
    authorization extends Rpc
      ? Signed
      : authorization &
          (signature extends SignatureEnvelope.from.Value
            ? { signature: SignatureEnvelope.from.ReturnValue<signature> }
            : {})
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.Rpc} to an {@link ox#AuthorizationTempo.AuthorizationTempo}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.fromRpc({
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: '0x1',
 *   nonce: '0x1',
 *   signature: {
 *     type: 'secp256k1',
 *     r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *     s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *     yParity: '0x0',
 *   },
 * })
 * ```
 *
 * @param authorization - The RPC-formatted AA Authorization.
 * @returns A signed {@link ox#AuthorizationTempo.AuthorizationTempo}.
 */
export function fromRpc(authorization: Rpc): Signed {
  const { address, chainId, nonce } = authorization
  const signature = SignatureEnvelope.fromRpc(authorization.signature)
  return {
    address,
    chainId: Number(chainId),
    nonce: BigInt(nonce),
    signature,
  } as never
}

export declare namespace fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.ListRpc} to an {@link ox#AuthorizationTempo.List}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorizationList = AuthorizationTempo.fromRpcList([{
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: '0x1',
 *   nonce: '0x1',
 *   signature: {
 *     type: 'secp256k1',
 *     r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *     s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *     yParity: '0x0',
 *   },
 * }])
 * ```
 *
 * @param authorizationList - The RPC-formatted AA Authorization list.
 * @returns A signed {@link ox#AuthorizationTempo.List}.
 */
export function fromRpcList(authorizationList: ListRpc): ListSigned {
  return authorizationList.map((x) => fromRpc(x as unknown as Rpc))
}

export declare namespace fromRpcList {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.Tuple} to an {@link ox#AuthorizationTempo.AuthorizationTempo}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.fromTuple([
 *   '0x1',
 *   '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   '0x3'
 * ])
 * // @log: {
 * // @log:   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:   chainId: 1,
 * // @log:   nonce: 3n
 * // @log: }
 * ```
 *
 * @example
 * It is also possible to append a serialized SignatureEnvelope to the end of an AA Authorization tuple.
 *
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.fromTuple([
 *   '0x1',
 *   '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   '0x3',
 *   '0x01a068a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064',
 * ])
 * // @log: {
 * // @log:   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:   chainId: 1,
 * // @log:   nonce: 3n
 * // @log:   signature: {
 * // @log:     r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:     s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:     yParity: 0,
 * // @log:   },
 * // @log: }
 * ```
 *
 * @param tuple - The [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) AA Authorization tuple.
 * @returns The {@link ox#AuthorizationTempo.AuthorizationTempo}.
 */
export function fromTuple<const tuple extends Tuple>(
  tuple: tuple,
): fromTuple.ReturnType<tuple> {
  const [chainId, address, nonce, signatureSerialized] = tuple
  const args: AuthorizationTempo = {
    address,
    chainId: chainId === '0x' ? 0 : Number(chainId),
    nonce: nonce === '0x' ? 0n : BigInt(nonce),
  }
  if (signatureSerialized)
    args.signature = SignatureEnvelope.deserialize(signatureSerialized)
  return from(args) as never
}

export declare namespace fromTuple {
  type ReturnType<authorization extends Tuple = Tuple> = Compute<
    AuthorizationTempo<authorization extends Tuple<true> ? true : false>
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.TupleList} to an {@link ox#AuthorizationTempo.List}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorizationList = AuthorizationTempo.fromTupleList([
 *   ['0x1', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x3'],
 *   ['0x3', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14'],
 * ])
 * // @log: [
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 1,
 * // @log:     nonce: 3n,
 * // @log:   },
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:   },
 * // @log: ]
 * ```
 *
 * @example
 * It is also possible to append a serialized SignatureEnvelope to the end of an AA Authorization tuple.
 *
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorizationList = AuthorizationTempo.fromTupleList([
 *   ['0x1', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x3', '0x01a068a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'],
 *   ['0x3', '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c', '0x14', '0x01a068a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'],
 * ])
 * // @log: [
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 1,
 * // @log:     nonce: 3n,
 * // @log:     signature: {
 * // @log:       r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:       s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:       yParity: 0,
 * // @log:     },
 * // @log:   },
 * // @log:   {
 * // @log:     address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:     signature: {
 * // @log:       r: BigInt('0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90'),
 * // @log:       s: BigInt('0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'),
 * // @log:       yParity: 0,
 * // @log:     },
 * // @log:   },
 * // @log: ]
 * ```
 *
 * @param tupleList - The [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) AA Authorization tuple list.
 * @returns An {@link ox#AuthorizationTempo.List}.
 */
export function fromTupleList<const tupleList extends TupleList>(
  tupleList: tupleList,
): fromTupleList.ReturnType<tupleList> {
  const list: Mutable<List> = []
  for (const tuple of tupleList) list.push(fromTuple(tuple))
  return list as never
}

export declare namespace fromTupleList {
  type ReturnType<tupleList extends TupleList> = Compute<
    TupleList<tupleList extends TupleList<true> ? true : false>
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the sign payload for an {@link ox#AuthorizationTempo.AuthorizationTempo} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
 *
 * @example
 * ### Secp256k1
 *
 * Standard Ethereum ECDSA signature using the secp256k1 curve.
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const payload = AuthorizationTempo.getSignPayload(authorization) // [!code focus]
 *
 * const signature = Secp256k1.sign({ payload, privateKey })
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature }
 * )
 * ```
 *
 * @example
 * ### P256
 *
 * ECDSA signature using the P-256 (secp256r1) curve. Requires embedding the
 * public key and a `prehash` flag indicating whether the payload was hashed
 * before signing.
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const { privateKey, publicKey } = P256.createKeyPair()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const payload = AuthorizationTempo.getSignPayload(authorization) // [!code focus]
 *
 * const signature = P256.sign({ payload, privateKey })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   prehash: false,
 *   publicKey,
 *   signature,
 * })
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }
 * )
 * ```
 *
 * @example
 * ### P256 (WebCrypto)
 *
 * When using WebCrypto keys, `prehash` must be `true` since WebCrypto always
 * hashes the payload internally before signing.
 *
 * ```ts twoslash
 * // @noErrors
 * import { WebCryptoP256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const payload = AuthorizationTempo.getSignPayload(authorization) // [!code focus]
 *
 * const signature = await WebCryptoP256.sign({ payload, privateKey })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   prehash: true,
 *   publicKey,
 *   signature,
 * })
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }
 * )
 * ```
 *
 * @example
 * ### WebAuthn
 *
 * Passkey-based signature using WebAuthn. Includes authenticator metadata
 * (authenticatorData and clientDataJSON) along with the P-256 signature and
 * public key.
 *
 * ```ts twoslash
 * // @noErrors
 * import { WebAuthnP256 } from 'ox'
 * import { AuthorizationTempo, SignatureEnvelope } from 'ox/tempo'
 *
 * const credential = await WebAuthnP256.createCredential({ name: 'Example' })
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const challenge = AuthorizationTempo.getSignPayload(authorization) // [!code focus]
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   challenge,
 *   credentialId: credential.id,
 * })
 * const signatureEnvelope = SignatureEnvelope.from({
 *   signature,
 *   publicKey: credential.publicKey,
 *   metadata,
 * })
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature: signatureEnvelope }
 * )
 * ```
 *
 * @param authorization - The {@link ox#AuthorizationTempo.AuthorizationTempo}.
 * @returns The sign payload.
 */
export function getSignPayload(authorization: AuthorizationTempo): Hex.Hex {
  return hash(authorization, { presign: true })
}

export declare namespace getSignPayload {
  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the hash for an {@link ox#AuthorizationTempo.AuthorizationTempo} in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const hash = AuthorizationTempo.hash(authorization) // [!code focus]
 * ```
 *
 * @param authorization - The {@link ox#AuthorizationTempo.AuthorizationTempo}.
 * @returns The hash.
 */
export function hash(
  authorization: AuthorizationTempo,
  options: hash.Options = {},
): Hex.Hex {
  const { presign } = options
  return Hash.keccak256(
    Hex.concat(
      '0x05',
      Rlp.fromHex(
        toTuple(
          presign
            ? {
                address: authorization.address,
                chainId: authorization.chainId,
                nonce: authorization.nonce,
              }
            : authorization,
        ),
      ),
    ),
  )
}

export declare namespace hash {
  type ErrorType =
    | toTuple.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType

  type Options = {
    /** Whether to hash this authorization for signing. @default false */
    presign?: boolean | undefined
  }
}

/**
 * Converts an {@link ox#AuthorizationTempo.AuthorizationTempo} to an {@link ox#AuthorizationTempo.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.toRpc({
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: 1,
 *   nonce: 1n,
 *   signature: {
 *     type: 'secp256k1',
 *     signature: {
 *       r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *       s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *       yParity: 0,
 *     },
 *   },
 * })
 * ```
 *
 * @param authorization - An AA Authorization.
 * @returns An RPC-formatted AA Authorization.
 */
export function toRpc(authorization: Signed): Rpc {
  const { address, chainId, nonce, signature } = authorization

  return {
    address,
    chainId: Hex.fromNumber(chainId),
    nonce: Hex.fromNumber(nonce),
    signature: SignatureEnvelope.toRpc(signature),
  }
}

export declare namespace toRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.List} to an {@link ox#AuthorizationTempo.ListRpc}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.toRpcList([{
 *   address: '0x0000000000000000000000000000000000000000',
 *   chainId: 1,
 *   nonce: 1n,
 *   signature: {
 *     type: 'secp256k1',
 *     signature: {
 *       r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
 *       s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
 *       yParity: 0,
 *     },
 *   },
 * }])
 * ```
 *
 * @param authorizationList - An AA Authorization List.
 * @returns An RPC-formatted AA Authorization List.
 */
export function toRpcList(authorizationList: ListSigned): ListRpc {
  return authorizationList.map((x) => toRpc(x as unknown as Signed)) as never
}

export declare namespace toRpcList {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.AuthorizationTempo} to an {@link ox#AuthorizationTempo.Tuple}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 *
 * const tuple = AuthorizationTempo.toTuple(authorization) // [!code focus]
 * // @log: [
 * // @log:   address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:   chainId: 1,
 * // @log:   nonce: 69n,
 * // @log: ]
 * ```
 *
 * @param authorization - The {@link ox#AuthorizationTempo.AuthorizationTempo}.
 * @returns An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) AA Authorization tuple.
 */
export function toTuple<const authorization extends AuthorizationTempo>(
  authorization: authorization,
): toTuple.ReturnType<authorization> {
  const { address, chainId, nonce } = authorization
  const signature = authorization.signature
    ? SignatureEnvelope.serialize(authorization.signature)
    : undefined
  return [
    chainId ? Hex.fromNumber(chainId) : '0x',
    address,
    nonce ? Hex.fromNumber(nonce) : '0x',
    ...(signature ? [signature] : []),
  ] as never
}

export declare namespace toTuple {
  type ReturnType<
    authorization extends AuthorizationTempo = AuthorizationTempo,
  > = Compute<
    Tuple<authorization extends AuthorizationTempo<true> ? true : false>
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.List} to an {@link ox#AuthorizationTempo.TupleList}.
 *
 * @example
 * ```ts twoslash
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization_1 = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 * const authorization_2 = AuthorizationTempo.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 3,
 *   nonce: 20n,
 * })
 *
 * const tuple = AuthorizationTempo.toTupleList([authorization_1, authorization_2]) // [!code focus]
 * // @log: [
 * // @log:   [
 * // @log:     address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     chainId: 1,
 * // @log:     nonce: 69n,
 * // @log:   ],
 * // @log:   [
 * // @log:     address: '0x1234567890abcdef1234567890abcdef12345678',
 * // @log:     chainId: 3,
 * // @log:     nonce: 20n,
 * // @log:   ],
 * // @log: ]
 * ```
 *
 * @param list - An {@link ox#AuthorizationTempo.List}.
 * @returns An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) AA Authorization tuple list.
 */
export function toTupleList<
  const list extends
    | readonly AuthorizationTempo<true>[]
    | readonly AuthorizationTempo<false>[],
>(list?: list | undefined): toTupleList.ReturnType<list> {
  if (!list || list.length === 0) return []

  const tupleList: Mutable<TupleList> = []
  for (const authorization of list) tupleList.push(toTuple(authorization))

  return tupleList as never
}

export declare namespace toTupleList {
  type ReturnType<
    list extends
      | readonly AuthorizationTempo<true>[]
      | readonly AuthorizationTempo<false>[],
  > = Compute<
    TupleList<list extends readonly AuthorizationTempo<true>[] ? true : false>
  >

  type ErrorType = Errors.GlobalErrorType
}

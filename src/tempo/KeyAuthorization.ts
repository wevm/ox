import * as AbiItem from '../core/AbiItem.js'
import type * as Address from '../core/Address.js'
import type * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as Rlp from '../core/Rlp.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TempoAddress from './TempoAddress.js'

/**
 * Key authorization for provisioning access keys.
 *
 * Access keys allow a root key (e.g., a passkey) to delegate transaction signing to secondary
 * keys with customizable permissions including expiry timestamps and per-TIP-20 token spending
 * limits. This enables a user to sign transactions without repeated passkey prompts.
 *
 * The root key signs a `KeyAuthorization` to grant an access key permission to sign transactions
 * on its behalf. The authorization is attached to a transaction (which can be signed by the access
 * key itself), and the protocol validates the authorization before storing the key in the
 * AccountKeychain precompile.
 *
 * Key authorization fields:
 * - `address`: Address derived from the access key's public key (the "key ID")
 * - `chainId`: Chain ID for replay protection (0 = valid on any chain)
 * - `expiry`: Unix timestamp when the key expires (undefined = never expires)
 * - `limits`: Per-TIP-20 token spending limits (only applies to `transfer()` and `approve()` calls)
 * - `type`: Key type (`secp256k1`, `p256`, or `webAuthn`)
 *
 * [Access Keys Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#access-keys)
 */
export type KeyAuthorization<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  addressType = Address.Address,
> = {
  /** Address derived from the public key of the key type. */
  address: addressType
  /** Chain ID for replay protection. */
  chainId: bigintType
  /** Unix timestamp when key expires (undefined = never expires). */
  expiry?: numberType | null | undefined
  /** TIP20 spending limits for this key. */
  limits?:
    | readonly TokenLimit<bigintType, numberType, addressType>[]
    | undefined
  /**
   * Call scopes restricting which contracts/selectors this key can call.
   *
   * - `undefined` = unrestricted key (any call allowed)
   * - `[]` = scoped mode with no calls allowed
   * - `[...]` = only listed contract+selector combinations allowed
   */
  scopes?: readonly Scope<addressType>[] | undefined
  /** Key type. (secp256k1, P256, WebAuthn). */
  type: SignatureEnvelope.Type
} & (signed extends true
  ? { signature: SignatureEnvelope.SignatureEnvelope<bigintType, numberType> }
  : {
      signature?:
        | SignatureEnvelope.SignatureEnvelope<bigintType, numberType>
        | undefined
    })

/** Input type for a Key Authorization. */
export type Input = KeyAuthorization<
  false,
  bigint,
  number,
  TempoAddress.Address
>

/** RPC representation matching the node's wire format. */
export type Rpc = {
  /** Allowed call scopes (node field: `allowedCalls`). */
  allowedCalls?: readonly RpcCallScope[] | undefined
  /** Chain ID (hex quantity). */
  chainId: Hex.Hex
  /** Expiry timestamp (hex quantity or null). */
  expiry: Hex.Hex | null | undefined
  /** Key identifier. */
  keyId: Address.Address
  /** Key type. */
  keyType: SignatureEnvelope.Type
  /** Token spending limits. */
  limits?: readonly RpcTokenLimit[] | undefined
  /** Signature envelope. */
  signature: SignatureEnvelope.SignatureEnvelopeRpc
}

/** RPC representation of a token limit (matches node's `TokenLimit` serde). */
export type RpcTokenLimit = {
  token: Address.Address
  limit: Hex.Hex
  period?: Hex.Hex | undefined
}

/** RPC representation of a call scope (matches node's `CallScope` serde). */
export type RpcCallScope = {
  target: Address.Address
  selectorRules?: readonly RpcSelectorRule[]
}

/** RPC representation of a selector rule (matches node's `SelectorRule` serde). */
export type RpcSelectorRule = {
  selector: Hex.Hex
  recipients?: readonly Address.Address[]
}

/** Signed representation of a Key Authorization. */
export type Signed<
  bigintType = bigint,
  numberType = number,
  addressType = Address.Address,
> = KeyAuthorization<true, bigintType, numberType, addressType>

type BaseTuple = readonly [
  chainId: Hex.Hex,
  keyType: Hex.Hex,
  keyId: Address.Address,
]

type TokenLimitTuple =
  | readonly [token: Address.Address, limit: Hex.Hex]
  | readonly [token: Address.Address, limit: Hex.Hex, period: Hex.Hex]

type SelectorRuleTuple = readonly [
  selector: Hex.Hex,
  recipients: readonly Address.Address[],
]

type CallScopeTuple = readonly [
  target: Address.Address,
  selectorRules: readonly SelectorRuleTuple[],
]

type AuthorizationTuple =
  | BaseTuple
  | readonly [...BaseTuple, expiry: Hex.Hex]
  | readonly [...BaseTuple, expiry: Hex.Hex, limits: readonly TokenLimitTuple[]]
  | readonly [
      ...BaseTuple,
      expiry: Hex.Hex,
      limits: readonly TokenLimitTuple[],
      calls: readonly CallScopeTuple[],
    ]

/** Tuple representation of a Key Authorization. */
export type Tuple<signed extends boolean = boolean> = signed extends true
  ? readonly [authorization: AuthorizationTuple, signature: Hex.Hex]
  : readonly [authorization: AuthorizationTuple]

/**
 * Call scope entry restricting which contract, selector, and recipients an access key can use.
 *
 * Multiple entries with the same `address` are grouped by target on the wire.
 *
 * - `{ address }` = any selector on this contract
 * - `{ address, selector }` = specific selector
 * - `{ address, selector, recipients }` = selector + recipient constraint
 *
 * [TIP-1011 Specification](https://docs.tempo.xyz/protocol/transactions/tip-1011)
 */
export type Scope<addressType = Address.Address> = {
  /** Target contract address. */
  address: addressType
  /**
   * 4-byte function selector, or a human-readable ABI signature
   * (e.g. `'transfer(address,uint256)'` or `'function transfer(address,uint256)'`).
   *
   * Signatures are encoded into a 4-byte selector automatically.
   * Omit to allow any selector on this contract.
   */
  selector?: Hex.Hex | string | undefined
  /**
   * Recipient allowlist for this selector (first ABI `address` argument).
   *
   * - `undefined` or `[]` = any recipient allowed
   * - `[...]` = only listed recipients allowed
   *
   * Only valid for constrained selectors: `transfer`, `approve`, `transferWithMemo`.
   */
  recipients?: readonly addressType[] | undefined
}

/**
 * Token spending limit for access keys.
 *
 * Defines a per-TIP-20 token spending limit for an access key. Limits deplete as tokens
 * are spent and can be updated by the root key via `updateSpendingLimit()`.
 *
 * [Access Keys Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#access-keys)
 */
export type TokenLimit<
  bigintType = bigint,
  numberType = number,
  addressType = Address.Address,
> = {
  /** Address of the TIP-20 token. */
  token: addressType
  /** Maximum spending amount for this token (enforced over the key's lifetime, or per period if `period` \> 0). */
  limit: bigintType
  /**
   * Period duration in seconds for recurring spending limits.
   *
   * - `0` or `undefined` = one-time limit
   * - `\> 0` = periodic limit that resets every `period` seconds
   */
  period?: numberType | undefined
}

/**
 * Converts a Key Authorization object into a typed {@link ox#KeyAuthorization.KeyAuthorization}.
 *
 * Use this to create an unsigned key authorization, then sign it with the root key using
 * {@link ox#KeyAuthorization.(getSignPayload:function)} and attach the signature. The signed authorization
 * can be included in a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo} via the
 * `keyAuthorization` field to provision the access key on-chain.
 *
 * [Access Keys Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#access-keys)
 *
 * @example
 * ### Secp256k1 Key
 *
 * Standard Ethereum ECDSA key using the secp256k1 curve.
 *
 * ```ts twoslash
 * import { Address, Secp256k1, Value } from 'ox'
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 * ```
 *
 * @example
 * ### WebCryptoP256 Key
 *
 * ```ts twoslash
 * import { Address, WebCryptoP256, Value } from 'ox'
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const keyPair = await WebCryptoP256.createKeyPair()
 * const address = Address.fromPublicKey(keyPair.publicKey)
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'p256',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures (Secp256k1)
 *
 * Attach a signature to a Key Authorization using a Secp256k1 private key to
 * authorize another Secp256k1 key on the account.
 *
 * ```ts twoslash
 * import { Address, Secp256k1, Value } from 'ox'
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const privateKey = '0x...'
 * const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 *
 * const rootPrivateKey = '0x...'
 * const signature = Secp256k1.sign({
 *   payload: KeyAuthorization.getSignPayload(authorization),
 *   privateKey: rootPrivateKey,
 * })
 *
 * const authorization_signed = KeyAuthorization.from(authorization, { signature })
 * ```
 *
 * @example
 * ### Attaching Signatures (WebAuthn)
 *
 * Attach a signature to a Key Authorization using a WebAuthn credential to
 * authorize a new WebCryptoP256 key on the account.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Address, Value, WebCryptoP256, WebAuthnP256 } from 'ox'
 * import { KeyAuthorization, SignatureEnvelope } from 'ox/tempo'
 *
 * const keyPair = await WebCryptoP256.createKeyPair()
 * const address = Address.fromPublicKey(keyPair.publicKey)
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'p256',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 *
 * const credential = await WebAuthnP256.createCredential({ name: 'Example' })
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   challenge: KeyAuthorization.getSignPayload(authorization),
 *   credentialId: credential.id,
 * })
 *
 * const signatureEnvelope = SignatureEnvelope.from({ // [!code focus]
 *   signature, // [!code focus]
 *   publicKey: credential.publicKey, // [!code focus]
 *   metadata, // [!code focus]
 * })
 * const authorization_signed = KeyAuthorization.from(
 *   authorization,
 *   { signature: signatureEnvelope }, // [!code focus]
 * )
 * ```
 *
 * @param authorization - A Key Authorization tuple in object format.
 * @param options - Key Authorization options.
 * @returns The {@link ox#KeyAuthorization.KeyAuthorization}.
 */
export function from<
  const authorization extends Input | Rpc,
  const signature extends SignatureEnvelope.from.Value | undefined = undefined,
>(
  authorization: authorization | KeyAuthorization,
  options: from.Options<signature> = {},
): from.ReturnType<authorization, signature> {
  if ('keyId' in authorization) return fromRpc(authorization as Rpc) as never
  const auth = authorization as KeyAuthorization & {
    limits?: readonly { token: TempoAddress.Address; limit: bigint }[]
    scopes?: readonly {
      address: TempoAddress.Address
      selector?: Hex.Hex | string
      recipients?: readonly TempoAddress.Address[]
    }[]
  }
  const resolved = {
    ...auth,
    address: TempoAddress.resolve(auth.address as TempoAddress.Address),
    ...(auth.limits
      ? {
          limits: auth.limits.map((l) => ({
            ...l,
            token: TempoAddress.resolve(l.token as TempoAddress.Address),
          })),
        }
      : {}),
    ...(auth.scopes
      ? {
          scopes: auth.scopes.map((scope) => ({
            ...scope,
            address: TempoAddress.resolve(scope.address),
            selector: resolveSelector(scope.selector),
            ...(scope.recipients
              ? {
                  recipients: scope.recipients.map((r) =>
                    TempoAddress.resolve(r),
                  ),
                }
              : {}),
          })),
        }
      : {}),
  }
  if (options.signature)
    return {
      ...resolved,
      signature: SignatureEnvelope.from(options.signature),
    } as never
  return resolved as never
}

export declare namespace from {
  type Options<
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = {
    /** The {@link ox#SignatureEnvelope.SignatureEnvelope} to attach to the Key Authorization. */
    signature?: signature | SignatureEnvelope.SignatureEnvelope | undefined
  }

  type ReturnType<
    authorization extends KeyAuthorization | Input | Rpc = KeyAuthorization,
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = Compute<
    authorization extends Rpc
      ? Signed
      : TempoAddress.ResolveAddresses<
          authorization &
            (signature extends SignatureEnvelope.from.Value
              ? { signature: SignatureEnvelope.from.ReturnValue<signature> }
              : {})
        >
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AuthorizationTempo.Rpc} to an {@link ox#AuthorizationTempo.AuthorizationTempo}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const keyAuthorization = KeyAuthorization.fromRpc({
 *   chainId: '0x1079',
 *   expiry: '0x174876e800',
 *   keyId: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   keyType: 'secp256k1',
 *   limits: [{ token: '0x20c0000000000000000000000000000000000001', limit: '0xf4240' }],
 *   signature: {
 *     type: 'secp256k1',
 *     r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *     s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *     yParity: '0x0'
 *   },
 * })
 * ```
 *
 * @param authorization - The RPC-formatted Key Authorization.
 * @returns A signed {@link ox#AuthorizationTempo.AuthorizationTempo}.
 */
export function fromRpc(authorization: Rpc): Signed {
  const { allowedCalls, chainId, keyId, expiry, limits, keyType } =
    authorization
  const signature = SignatureEnvelope.fromRpc(authorization.signature)

  // Unflatten nested allowedCalls into flat scopes
  const scopes = allowedCalls
    ? allowedCalls.flatMap((callScope) => {
        if (!callScope.selectorRules || callScope.selectorRules.length === 0)
          return [{ address: callScope.target }] as Scope[]
        return callScope.selectorRules.map(
          (rule): Scope => ({
            address: callScope.target,
            selector: normalizeSelector(rule.selector),
            ...(rule.recipients && rule.recipients.length > 0
              ? { recipients: rule.recipients }
              : {}),
          }),
        )
      })
    : undefined

  return {
    address: keyId,
    chainId: chainId === '0x' ? 0n : Hex.toBigInt(chainId),
    ...(expiry != null ? { expiry: Number(expiry) } : {}),
    limits: limits?.map((limit) => ({
      token: limit.token,
      limit: BigInt(limit.limit),
      ...(limit.period && hexToNumber(limit.period) > 0
        ? { period: hexToNumber(limit.period) }
        : {}),
    })),
    ...(scopes ? { scopes } : {}),
    signature,
    type: keyType,
  }
}

export declare namespace fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#KeyAuthorization.Tuple} to an {@link ox#KeyAuthorization.KeyAuthorization}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const authorization = KeyAuthorization.fromTuple([
 *   [
 *     '0x',
 *     '0x00',
 *     '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *     '0x174876e800',
 *     [['0x20c0000000000000000000000000000000000001', '0xf4240']],
 *   ],
 *   '0x01a068a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064',
 * ])
 * ```
 *
 * @example
 * Unsigned Key Authorization tuple (no signature):
 *
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const authorization = KeyAuthorization.fromTuple([
 *   [
 *     '0x',
 *     '0x00',
 *     '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *     '0x174876e800',
 *     [['0x20c0000000000000000000000000000000000001', '0xf4240']],
 *   ],
 * ])
 * ```
 *
 * @param tuple - The Key Authorization tuple.
 * @returns The {@link ox#KeyAuthorization.KeyAuthorization}.
 */
export function fromTuple<const tuple extends Tuple>(
  tuple: tuple,
): fromTuple.ReturnType<tuple> {
  const [authorization, signatureSerialized] = tuple
  const [chainId, keyType_hex, keyId, expiry, limits, scopes] = authorization
  const keyType = (() => {
    switch (keyType_hex) {
      case '0x':
      case '0x00':
        return 'secp256k1'
      case '0x01':
        return 'p256'
      case '0x02':
        return 'webAuthn'
      default:
        throw new Error(`Invalid key type: ${keyType_hex}`)
    }
  })()
  const args: KeyAuthorization = {
    address: keyId,
    expiry:
      typeof expiry !== 'undefined'
        ? hexToNumber(expiry) || undefined
        : undefined,
    type: keyType,
    chainId: chainId === '0x' ? 0n : Hex.toBigInt(chainId),
    ...(typeof expiry !== 'undefined'
      ? { expiry: hexToNumber(expiry) || undefined }
      : {}),
    ...(typeof limits !== 'undefined' &&
    Array.isArray(limits) &&
    limits.length > 0
      ? {
          limits: limits.map((limitTuple: any) => {
            const [token, limit, period] = limitTuple
            return {
              token,
              limit: hexToBigint(limit),
              ...(typeof period !== 'undefined'
                ? { period: hexToNumber(period) }
                : {}),
            }
          }),
        }
      : {}),
    ...(typeof scopes !== 'undefined' && Array.isArray(scopes)
      ? {
          scopes: scopes.flatMap((scopeTuple: any) => {
            const [address, selectorRules] = scopeTuple
            // If no selector rules, this is an address-only scope
            if (!Array.isArray(selectorRules) || selectorRules.length === 0)
              return [{ address }]
            // Flatten each selector rule into a separate scope entry
            return selectorRules.map((ruleTuple: any) => {
              const [selector, recipients] = ruleTuple
              return {
                address,
                selector,
                ...(Array.isArray(recipients) && recipients.length > 0
                  ? { recipients }
                  : {}),
              }
            })
          }),
        }
      : {}),
  }
  if (signatureSerialized)
    args.signature = SignatureEnvelope.deserialize(signatureSerialized)
  return from(args) as never
}

export declare namespace fromTuple {
  type ReturnType<authorization extends Tuple = Tuple> = Compute<
    KeyAuthorization<authorization extends Tuple<true> ? true : false>
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the sign payload for an {@link ox#KeyAuthorization.KeyAuthorization}.
 *
 * The root key must sign this payload to authorize the access key. The resulting signature
 * is attached to the key authorization via {@link ox#KeyAuthorization.(from:function)} with the
 * `signature` option.
 *
 * [Access Keys Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#access-keys)
 *
 * @example
 * ```ts twoslash
 * import { Address, Secp256k1, Value } from 'ox'
 * import { KeyAuthorization } from 'ox/tempo'
 *
 * const privateKey = '0x...'
 * const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 *
 * const payload = KeyAuthorization.getSignPayload(authorization) // [!code focus]
 * ```
 *
 * @param authorization - The {@link ox#KeyAuthorization.KeyAuthorization}.
 * @returns The sign payload.
 */
export function getSignPayload(authorization: KeyAuthorization): Hex.Hex {
  return hash(authorization)
}

export declare namespace getSignPayload {
  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Deserializes an RLP-encoded {@link ox#KeyAuthorization.KeyAuthorization}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 * import { Value } from 'ox'
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6)
 *   }],
 * })
 *
 * const serialized = KeyAuthorization.serialize(authorization)
 * const deserialized = KeyAuthorization.deserialize(serialized) // [!code focus]
 * ```
 *
 * @param serialized - The RLP-encoded Key Authorization.
 * @returns The {@link ox#KeyAuthorization.KeyAuthorization}.
 */
export function deserialize(serialized: Hex.Hex): KeyAuthorization {
  const tuple = Rlp.toHex(serialized) as unknown as Tuple
  return fromTuple(tuple)
}

export declare namespace deserialize {
  type ErrorType =
    | Rlp.toHex.ErrorType
    | fromTuple.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the hash for an {@link ox#KeyAuthorization.KeyAuthorization}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 * import { Value } from 'ox'
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6)
 *   }],
 * })
 *
 * const hash = KeyAuthorization.hash(authorization) // [!code focus]
 * ```
 *
 * @param authorization - The {@link ox#KeyAuthorization.KeyAuthorization}.
 * @returns The hash.
 */
export function hash(authorization: KeyAuthorization): Hex.Hex {
  const [authorizationTuple] = toTuple(authorization)
  const serialized = Rlp.fromHex(authorizationTuple)
  return Hash.keccak256(serialized)
}

export declare namespace hash {
  type ErrorType =
    | toTuple.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#KeyAuthorization.KeyAuthorization} to RLP-encoded hex.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 * import { Value } from 'ox'
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6)
 *   }],
 * })
 *
 * const serialized = KeyAuthorization.serialize(authorization) // [!code focus]
 * ```
 *
 * @param authorization - The {@link ox#KeyAuthorization.KeyAuthorization}.
 * @returns The RLP-encoded Key Authorization.
 */
export function serialize(authorization: KeyAuthorization): Hex.Hex {
  const tuple = toTuple(authorization)
  return Rlp.fromHex(tuple as any)
}

export declare namespace serialize {
  type ErrorType =
    | toTuple.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#KeyAuthorization.KeyAuthorization} to an {@link ox#KeyAuthorization.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 * import { Value } from 'ox'
 *
 * const authorization = KeyAuthorization.toRpc({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6)
 *   }],
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
 * @param authorization - A Key Authorization.
 * @returns An RPC-formatted Key Authorization.
 */
export function toRpc(authorization: Signed): Rpc {
  const { address, scopes, chainId, expiry, limits, type, signature } =
    authorization

  // Group flat scopes by address into nested allowedCalls wire format
  const allowedCalls = (() => {
    if (!scopes) return undefined
    const grouped = new Map<string, RpcSelectorRule[]>()
    for (const scope of scopes) {
      const key = scope.address as string
      if (!grouped.has(key)) grouped.set(key, [])
      if (scope.selector) {
        grouped.get(key)!.push({
          selector: resolveSelector(scope.selector)!,
          ...(scope.recipients && scope.recipients.length > 0
            ? { recipients: scope.recipients }
            : {}),
        })
      }
    }
    return [...grouped.entries()].map(
      ([target, selectorRules]): RpcCallScope => ({
        target: target as Address.Address,
        ...(selectorRules.length > 0 ? { selectorRules } : {}),
      }),
    )
  })()

  return {
    chainId: chainId === 0n ? '0x' : Hex.fromNumber(chainId),
    expiry: typeof expiry === 'number' ? Hex.fromNumber(expiry) : null,
    keyId: TempoAddress.resolve(address),
    keyType: type,
    limits: limits?.map(({ token, limit, period }) => ({
      token,
      limit: Hex.fromNumber(limit),
      ...(period ? { period: numberToHex(period) } : {}),
    })),
    signature: SignatureEnvelope.toRpc(signature),
    ...(allowedCalls ? { allowedCalls } : {}),
  }
}

export declare namespace toRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#KeyAuthorization.KeyAuthorization} to an {@link ox#KeyAuthorization.Tuple}.
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization } from 'ox/tempo'
 * import { Value } from 'ox'
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   expiry: 1234567890,
 *   type: 'secp256k1',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6)
 *   }],
 * })
 *
 * const tuple = KeyAuthorization.toTuple(authorization) // [!code focus]
 * // @log: [
 * // @log:   '0x174876e800',
 * // @log:   [['0x20c0000000000000000000000000000000000001', '0xf4240']],
 * // @log:   '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 * // @log:   'secp256k1',
 * // @log: ]
 * ```
 *
 * @param authorization - The {@link ox#KeyAuthorization.KeyAuthorization}.
 * @returns A Tempo Key Authorization tuple.
 */
export function toTuple<const authorization extends KeyAuthorization>(
  authorization: authorization,
): toTuple.ReturnType<authorization> {
  const { address, chainId, scopes, expiry, limits } = authorization
  const signature = authorization.signature
    ? SignatureEnvelope.serialize(authorization.signature)
    : undefined
  const type = (() => {
    switch (authorization.type) {
      case 'secp256k1':
        return '0x'
      case 'p256':
        return '0x01'
      case 'webAuthn':
        return '0x02'
      default:
        throw new Error(`Invalid key type: ${authorization.type}`)
    }
  })()
  const limitsValue = limits?.map((limit) => {
    const tuple: any[] = [limit.token, bigintToHex(limit.limit)]
    // Canonical: omit period when 0 (one-time limit)
    if (limit.period && limit.period > 0) tuple.push(numberToHex(limit.period))
    return tuple
  })
  // Group flat scopes by address for wire format
  const callsValue = (() => {
    if (!scopes) return undefined
    const grouped = new Map<
      string,
      [Hex.Hex, (readonly Address.Address[])[]][]
    >()
    for (const scope of scopes) {
      const key = scope.address as string
      if (!grouped.has(key)) grouped.set(key, [])
      if (scope.selector) {
        grouped
          .get(key)!
          .push([
            resolveSelector(scope.selector)!,
            (scope.recipients ??
              []) as unknown as (readonly Address.Address[])[],
          ])
      }
    }
    return [...grouped.entries()].map(([address, selectorRules]) => [
      address,
      selectorRules.map(([selector, recipients]) => [selector, recipients]),
    ])
  })()
  const authorizationTuple = [
    bigintToHex(chainId),
    type,
    address,
    // expiry is required in the tuple when limits or scopes are present
    // expiry=0 is treated the same as undefined (never expires)
    (expiry !== null && expiry !== undefined && expiry !== 0) ||
    limitsValue ||
    callsValue
      ? numberToHex(expiry ?? 0)
      : undefined,
    // limits is required in the tuple when scopes are present
    limitsValue || callsValue ? (limitsValue ?? []) : undefined,
    callsValue,
  ].filter((x) => typeof x !== 'undefined')
  return [authorizationTuple, ...(signature ? [signature] : [])] as never
}

export declare namespace toTuple {
  type ReturnType<authorization extends KeyAuthorization = KeyAuthorization> =
    Compute<Tuple<authorization extends KeyAuthorization<true> ? true : false>>

  type ErrorType = Errors.GlobalErrorType
}

function bigintToHex(value: bigint): Hex.Hex {
  return value === 0n ? '0x' : Hex.fromNumber(value)
}

function numberToHex(value: number): Hex.Hex {
  return value === 0 ? '0x' : Hex.fromNumber(value)
}

function hexToBigint(hex: Hex.Hex): bigint {
  return hex === '0x' ? 0n : BigInt(hex)
}

function hexToNumber(hex: Hex.Hex): number {
  return hex === '0x' ? 0 : Hex.toNumber(hex)
}

function normalizeSelector(selector: Hex.Hex | number[]): Hex.Hex {
  if (typeof selector === 'string') return selector
  if (Array.isArray(selector))
    return Hex.fromBytes(new Uint8Array(selector)) as Hex.Hex
  return selector
}

function resolveSelector(
  selector: Hex.Hex | string | undefined,
): Hex.Hex | undefined {
  if (!selector) return undefined
  if (selector.startsWith('0x')) return selector as Hex.Hex
  return AbiItem.getSelector(selector)
}

/** @entrypointCategory Tempo */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc
export type {}

/**
 * Utilities for Tempo-flavoured EIP-7702 authorizations.
 *
 * Tempo extends EIP-7702 to support more signature types (secp256k1, P256, and WebAuthn),
 * enabling passkey-based account delegation. Authorizations delegate an account to a specified
 * implementation contract.
 *
 * [Tempo Authorization Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#tempo-authorization-list)
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { AuthorizationTempo } from 'ox/tempo'
 *
 * const authorization = AuthorizationTempo.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const payload = AuthorizationTempo.getSignPayload(authorization)
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 *
 * const authorization_signed = AuthorizationTempo.from(
 *   authorization,
 *   { signature }
 * )
 * ```
 *
 * @category Reference
 */
export * as AuthorizationTempo from './AuthorizationTempo.js'

/**
 * Tempo key authorization utilities for provisioning and signing access keys.
 *
 * Access keys allow a root key (e.g., a passkey) to delegate transaction signing to secondary
 * keys with customizable permissions including expiry timestamps and per-TIP-20 token spending
 * limits. This enables a user to sign transactions without repeated passkey prompts.
 *
 * [Access Keys Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#access-keys)
 *
 * @example
 * ```ts twoslash
 * import { KeyAuthorization, SignatureEnvelope } from 'ox/tempo'
 * import { Address, Secp256k1, WebCryptoP256, Value } from 'ox'
 *
 * const keyPair = await WebCryptoP256.createKeyPair()
 * const address = Address.fromPublicKey(keyPair.publicKey)
 *
 * const authorization = KeyAuthorization.from({
 *   address,
 *   expiry: 1234567890,
 *   type: 'p256',
 *   limits: [{
 *     token: '0x20c0000000000000000000000000000000000001',
 *     limit: Value.from('10', 6),
 *   }],
 * })
 *
 * const privateKey = '0x...'
 * const payload = KeyAuthorization.getSignPayload(authorization)
 * const signature = SignatureEnvelope.from(
 *   Secp256k1.sign({ payload, privateKey }),
 * )
 *
 * KeyAuthorization.from(authorization, { signature })
 * ```
 *
 * @category Reference
 */
export * as KeyAuthorization from './KeyAuthorization.js'

/**
 * Pool ID utilities for computing pool identifiers from token pairs.
 *
 * Pool IDs are deterministic keys derived from two token addresses (order-independent)
 * used to identify trading pairs on Tempo's enshrined stablecoin DEX.
 *
 * [Stablecoin DEX Specification](https://docs.tempo.xyz/protocol/exchange/spec)
 *
 * @example
 * ```ts twoslash
 * import { PoolId } from 'ox/tempo'
 *
 * const poolId = PoolId.from({
 *   userToken: 1n,
 *   validatorToken: 2n,
 * })
 * ```
 *
 * @category Reference
 */
export * as PoolId from './PoolId.js'

/**
 * Signature envelope utilities for secp256k1, P256, WebAuthn, and keychain signatures.
 *
 * Tempo transactions support multiple signature types: secp256k1 (65 bytes), P256 for passkeys
 * (type `0x01`), WebAuthn (type `0x02`), and Keychain for access keys (type `0x03`).
 *
 * [Signature Types Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#signature-types)
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { SignatureEnvelope } from 'ox/tempo'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const envelope = SignatureEnvelope.from(signature)
 * ```
 *
 * @category Reference
 */
export * as SignatureEnvelope from './SignatureEnvelope.js'

/**
 * Tick-based pricing utilities for DEX price conversions.
 *
 * Prices on Tempo's stablecoin DEX are discretized into integer ticks with a tick size of 0.1 bps
 * (where `price = PRICE_SCALE + tick` and `PRICE_SCALE = 100_000`). Orders must be placed at ticks
 * divisible by `TICK_SPACING = 10` (1 bp grid), within bounds of ±2000 ticks (±2%).
 *
 * [Stablecoin DEX Pricing](https://docs.tempo.xyz/protocol/exchange/spec#key-concepts)
 *
 * @example
 * ```ts twoslash
 * import { Tick } from 'ox/tempo'
 *
 * const price = Tick.toPrice(100) // "1.001" (0.1% above 1.0)
 * const tick = Tick.fromPrice('0.999') // -100
 * ```
 *
 * @category Reference
 */
export * as Tick from './Tick.js'

/**
 * TIP-20 token ID utilities for converting between token IDs and addresses.
 *
 * TIP-20 is Tempo's native token standard for stablecoins with deterministic addresses
 * derived from sequential token IDs. TIP-20 extends ERC-20 with payment features like
 * configurable fee tokens, transfer memos, and built-in role-based access control.
 *
 * [TIP-20 Token Standard](https://docs.tempo.xyz/protocol/tip20/overview)
 *
 * @example
 * ```ts twoslash
 * import { TokenId } from 'ox/tempo'
 *
 * const tokenId = TokenId.from(1n)
 * const address = TokenId.toAddress(1n)
 * // '0x20c0000000000000000000000000000000000001'
 * ```
 *
 * @category Reference
 */
export * as TokenId from './TokenId.js'

/**
 * Token role utilities for serializing role identifiers to keccak256 hashes.
 *
 * TIP-20 includes a built-in RBAC system with roles like `ISSUER_ROLE` (mint/burn),
 * `PAUSE_ROLE`/`UNPAUSE_ROLE` (emergency controls), and `BURN_BLOCKED_ROLE` (compliance).
 *
 * [TIP-20 RBAC](https://docs.tempo.xyz/protocol/tip20/overview#role-based-access-control-rbac)
 *
 * @example
 * ```ts twoslash
 * import { TokenRole } from 'ox/tempo'
 *
 * const hash = TokenRole.serialize('issuer')
 * ```
 *
 * @category Reference
 */
export * as TokenRole from './TokenRole.js'

/**
 * Utilities for converting between RPC and structured transaction formats.
 *
 * Tempo Transactions (type `0x76`) are a new EIP-2718 transaction type with native support
 * for passkeys, call batching, fee sponsorship, parallelizable nonces, and scheduled execution.
 *
 * [Tempo Transactions](https://docs.tempo.xyz/protocol/transactions)
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Transaction } from 'ox/tempo'
 *
 * const transaction = Transaction.fromRpc({
 *   hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   nonce: '0x357',
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: '0x12f296f',
 *   calls: [
 *     {
 *       input: '0xdeadbeef',
 *       to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *       value: '0x9b6e64a8ec60000',
 *     },
 *   ],
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 *   transactionIndex: '0x2',
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   value: '0x9b6e64a8ec60000',
 *   gas: '0x43f5d',
 *   maxFeePerGas: '0x2ca6ae494',
 *   maxPriorityFeePerGas: '0x41cc3c0',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   signature: {
 *     r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *     s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *     type: 'secp256k1',
 *     yParity: '0x0',
 *   },
 *   chainId: '0x1',
 *   accessList: [],
 *   type: '0x76',
 * })
 * ```
 *
 * @category Reference
 */
export * as Transaction from './Transaction.js'
/**
 * Utilities for working with Tempo transaction receipts.
 *
 * Tempo receipts include additional fields like `feePayer` (the address that paid fees)
 * and `feeToken` (the TIP-20 token used for fee payment).
 *
 * [Tempo Transactions](https://docs.tempo.xyz/protocol/transactions)
 *
 * @example
 * ```ts twoslash
 * import { TransactionReceipt } from 'ox/tempo'
 *
 * const receipt = TransactionReceipt.fromRpc({
 *   status: '0x1',
 *   feePayer: '0x...',
 *   feeToken: '0x20c0000000000000000000000000000000000001',
 *   // ... other fields
 * } as any)
 * ```
 *
 * @category Reference
 */
export * as TransactionReceipt from './TransactionReceipt.js'
/**
 * Utilities for preparing RPC-formatted transaction requests.
 *
 * Convert structured transaction requests to RPC format for submission to Tempo nodes,
 * including support for batched calls and fee token specification.
 *
 * [Tempo Transactions](https://docs.tempo.xyz/protocol/transactions)
 *
 * @example
 * ```ts twoslash
 * import { TransactionRequest } from 'ox/tempo'
 *
 * const request = TransactionRequest.toRpc({
 *   calls: [{ to: '0xcafebabecafebabecafebabecafebabecafebabe', data: '0xdeadbeef' }],
 *   feeToken: '0x20c0000000000000000000000000000000000000',
 * })
 * ```
 *
 * @category Reference
 */
export * as TransactionRequest from './TransactionRequest.js'
/**
 * Utilities for instantiating, serializing, and hashing Tempo transaction envelopes.
 *
 * Create, sign, and serialize Tempo transactions with support for configurable fee tokens,
 * call batching, fee sponsorship, access keys, and scheduled execution via `validAfter`/`validBefore`.
 *
 * [Tempo Transaction Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction)
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, Value } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{ to: '0x0000000000000000000000000000000000000000', data: '0xdeadbeef' }],
 *   maxFeePerGas: Value.fromGwei('10'),
 * })
 *
 * const payload = TxEnvelopeTempo.getSignPayload(envelope)
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 *
 * const envelope_signed = TxEnvelopeTempo.from(envelope, { signature })
 * const envelope_serialized = TxEnvelopeTempo.serialize(envelope_signed)
 * ```
 *
 * @category Reference
 */
export * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

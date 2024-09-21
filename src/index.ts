/**
 * Utilities & types for working with [Application Binary Interfaces (ABIs)](https://docs.soliditylang.org/en/latest/abi-spec.html)
 *
 * :::note
 *
 * If you are looking for ABI parameter **encoding** & **decoding** functions, see {@link ox#AbiParameters.(encode:function)} & {@link ox#AbiParameters.(decode:function)}.
 *
 * :::
 *
 * @example
 * ### Instantiating JSON ABIs
 *
 * An {@link ox#Abi.Abi} can be instantiated from a JSON ABI by using {@link ox#Abi.(from:function)}:
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([{
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * }])
 *
 * abi
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating Human Readable ABIs
 *
 * An {@link ox#Abi.Abi} can be instantiated from a human-readable ABI by using {@link ox#Abi.(from:function)}:
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 *
 * const abi = Abi.from([
 *   'function approve(address spender, uint256 amount) returns (bool)',
 * ])
 *
 * abi
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Formatting ABIs
 *
 * An {@link ox#Abi.Abi} can be formatted into a human-readable ABI by using {@link ox#Abi.(format:function)}:
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 * const abi = Abi.from([{
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * }])
 * //---cut---
 * const formatted = Abi.format(abi)
 *
 * formatted
 * //    ^?
 *
 *
 * ```
 *
 * @category ABI
 */
export * as Abi from './Abi.js'

/**
 * Utilities & types for working with [Constructors](https://docs.soliditylang.org/en/latest/abi-spec.html#json) on ABIs.
 *
 * `AbiConstructor` is a sub-type of [`AbiItem`](/api/AbiItem).
 *
 * @example
 * ### Instantiating via JSON ABI
 *
 * An `AbiConstructor` can be instantiated from a JSON ABI by using {@link ox#AbiConstructor.(fromAbi:function)}:
 *
 * ```ts twoslash
 * import { Abi, AbiConstructor } from 'ox'
 *
 * const abi = Abi.from([
 *   'constructor(address owner)',
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiConstructor.fromAbi(abi) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating via Human-Readable ABI Item
 *
 * An `AbiConstructor` can be instantiated from a human-readable ABI by using {@link ox#AbiConstructor.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from('constructor(address owner)')
 *
 * constructor
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Encoding to Deploy Data
 *
 * Constructor arguments can be ABI-encoded using {@link ox#AbiConstructor.(encode:function)} (with bytecode) into deploy data. This data can then be passed to a transaction to deploy a contract.
 *
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from('constructor(address, uint256)')
 *
 * const data = AbiConstructor.encode(constructor, { // [!code focus]
 *   bytecode: '0x...', // [!code focus]
 *   args: ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 123n], // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @category ABI
 */
export * as AbiConstructor from './AbiConstructor.js'

/**
 * Utilities & types for working with [Errors](https://docs.soliditylang.org/en/latest/abi-spec.html#json) on ABIs.
 *
 * `AbiError` is a sub-type of [`AbiItem`](/api/AbiItem).
 *
 * @example
 * ### Instantiating via JSON ABI
 *
 * An `AbiError` can be instantiated from a JSON ABI by using {@link ox#AbiError.(fromAbi:function)}:
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiError.fromAbi(abi, { name: 'BadSignatureV' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating via Human-Readable ABI Item
 *
 * An `AbiError` can be instantiated from a human-readable ABI by using {@link ox#AbiError.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const error = AbiError.from('error BadSignatureV(uint8 v)')
 *
 * error
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Decoding Error Data
 *
 * Error data can be ABI-decoded using the {@link ox#AbiError.(decode:function)} function.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([...])
 * const error = AbiError.fromAbi(abi, { name: 'InvalidSignature' })
 *
 * const value = AbiError.decode(error, '0xecde634900000000000000000000000000000000000000000000000000000000000001a400000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001') // [!code focus]
 * // @log: [420n, 69n, 1]
 * ```
 *
 * @category ABI
 */
export * as AbiError from './AbiError.js'

/**
 * Utilities & types for working with [Events](https://docs.soliditylang.org/en/latest/abi-spec.html#json) on ABIs.
 *
 * `AbiEvent` is a sub-type of [`AbiItem`](/api/AbiItem).
 *
 * @example
 * ### Instantiating via JSON ABI
 *
 * An `AbiEvent` can be instantiated from a JSON ABI by using {@link ox#AbiEvent.(fromAbi:function)}:
 *
 * ```ts twoslash
 * import { Abi, AbiEvent } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiEvent.fromAbi(abi, { name: 'Transfer' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating via Human-Readable ABI Item
 *
 * An `AbiEvent` can be instantiated from a human-readable ABI by using {@link ox#AbiEvent.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)' // [!code hl]
 * )
 *
 * transfer
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Encoding to Event Topics
 *
 * Encode an `AbiEvent` into topics using {@link ox#AbiEvent.(encode:function)}:
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)'
 * )
 *
 * const { topics } = AbiEvent.encode(transfer, {
 *   from: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code hl]
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' // [!code hl]
 * })
 * // @log: [
 * // @log:   '0x406dade31f7ae4b5dbc276258c28dde5ae6d5c2773c5745802c493a2360e55e0',
 * // @log:   '0x00000000000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 * // @log:   '0x0000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8'
 * // @log: ]
 * ```
 *
 * @example
 * ### Decoding Event Topics and Data
 *
 * Event topics and data can be decoded using {@link ox#AbiEvent.(decode:function)}:
 *
 * ```ts twoslash
 * import { AbiEvent } from 'ox'
 *
 * const transfer = AbiEvent.from(
 *   'event Transfer(address indexed from, address indexed to, uint256 value)'
 * )
 *
 * const log = {
 *   // ...
 *   data: '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *     '0x000000000000000000000000a5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 *   ],
 * } as const
 *
 * const decoded = AbiEvent.decode(transfer, log)
 * // @log: {
 * // @log:   from: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac',
 * // @log:   value: 1n
 * // @log: }
 * ```
 *
 * @category ABI
 */
export * as AbiEvent from './AbiEvent.js'

/**
 * Utilities & types for working with [Functions](https://docs.soliditylang.org/en/latest/abi-spec.html#json) on ABIs.
 *
 * `AbiFunction` is a sub-type of [`AbiItem`](/api/AbiItem).
 *
 * @example
 * ### Instantiating via JSON ABI
 *
 * An `AbiFunction` can be instantiated from a JSON ABI by using {@link ox#AbiFunction.(fromAbi:function)}:
 *
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiFunction.fromAbi(abi, { name: 'bar' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating via Human-Readable ABI Item
 *
 * An `AbiFunction` can be instantiated from a human-readable ABI by using {@link ox#AbiFunction.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const bar = AbiFunction.from('function bar(string a) returns (uint256 x)')
 *
 * bar
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Encoding to Function Calldata
 *
 * A Function and its arguments can be ABI-encoded into calldata using the {@link ox#AbiFunction.(encodeInput:function)} function. The output of this function can then be passed to `eth_sendTransaction` or `eth_call` as the `data` parameter.
 *
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from('function approve(address, uint256)')
 *
 * const data = AbiFunction.encodeInput( // [!code focus]
 *   approve, // [!code focus]
 *   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 69420n] // [!code focus]
 * ) // [!code focus]
 * // @log: '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000010f2c'
 * ```
 *
 * @example
 * ### Decoding a Function's Return Value
 *
 * A Function's return value can be ABI-decoded using the {@link ox#AbiFunction.(decodeOutput:function)} function.
 *
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const data = '0x000000000000000000000000000000000000000000000000000000000000002a'
 * //    ↑ Example data that could be returned from a contract call via `eth_call`.
 *
 * const totalSupply = AbiFunction.from('function totalSupply() returns (uint256)')
 *
 * const output = AbiFunction.decodeOutput(totalSupply, data) // [!code focus]
 * // @log: 42n
 * ```
 *
 * @category ABI
 */
export * as AbiFunction from './AbiFunction.js'

/**
 * Utilities & types for working with [ABI Items](https://docs.soliditylang.org/en/latest/abi-spec.html#json)
 *
 * The `AbiItem` type is a super-type of:
 * - [`AbiConstructor`](/api/AbiConstructor)
 * - [`AbiFunction`](/api/AbiFunction)
 * - [`AbiEvent`](/api/AbiEvent)
 * - [`AbiError`](/api/AbiError)
 *
 * @example
 * ### Instantiating via JSON ABI
 *
 * An `AbiItem` can be instantiated from a JSON ABI by using {@link ox#AbiItem.(fromAbi:function)}:
 *
 * ```ts twoslash
 * import { Abi, AbiItem } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'event Transfer(address owner, address to, uint256 tokenId)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiItem.fromAbi(abi, { name: 'Transfer' }) // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Instantiating via Human-Readable ABI Item
 *
 * A Human Readable ABI can be parsed into a typed ABI object:
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.from('function approve(address spender, uint256 amount) returns (bool)')
 *
 * abiItem
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Formatting ABI Items
 *
 * An `AbiItem` can be formatted into a human-readable ABI Item by using {@link ox#AbiItem.(format:function)}:
 *
 * ```ts twoslash
 * import { AbiItem } from 'ox'
 *
 * const abiItem = AbiItem.from('function approve(address spender, uint256 amount) returns (bool)')
 *
 * const formatted = AbiItem.format(abiItem)
 * // @log: 'function approve(address spender, uint256 amount) returns (bool)'
 * ```
 *
 * @category ABI
 */
export * as AbiItem from './AbiItem.js'

/**
 * Utilities & types for encoding, decoding, and working with [ABI Parameters](https://docs.soliditylang.org/en/latest/abi-spec.html#types)
 *
 * @example
 * ### Encoding ABI Parameters
 *
 * ABI Parameters can be ABI-encoded as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec) using {@link ox#AbiParameters.(encode:function)}:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.encode(
 *   AbiParameters.from('string, uint, bool'),
 *   ['wagmi', 420n, true],
 * )
 * ```
 *
 * :::tip
 *
 * The example above uses {@link ox#AbiParameters.(from:function)} to specify human-readable ABI Parameters.
 *
 * However, you can also pass JSON-ABI Parameters:
 *
 * ```ts
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.encode(
 *   [{ type: 'string' }, { type: 'uint' }, { type: 'bool' }],
 *   ['wagmi', 420n, true],
 * )
 * ```
 *
 * :::
 *
 * @example
 * ### Decoding ABI Parameters
 *
 * ABI-encoded data can be decoded using {@link ox#AbiParameters.(decode:function)}:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const data = AbiParameters.decode(
 *   AbiParameters.from('string, uint, bool'),
 *   '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000',
 * )
 * // @log: ['wagmi', 420n, true]
 * ```
 *
 * @example
 * ### JSON-ABI Parameters
 *
 * JSON-ABI Parameters can be instantiated using {@link ox#AbiParameters.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const parameters = AbiParameters.from([
 *   {
 *     name: 'spender',
 *     type: 'address',
 *   },
 *   {
 *     name: 'amount',
 *     type: 'uint256',
 *   },
 * ])
 *
 * parameters
 * //^?
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Human Readable ABI Parameters
 *
 * Human Readable ABI Parameters can be instantiated using {@link ox#AbiParameters.(from:function)}:
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 *
 * const parameters = AbiParameters.from('address spender, uint256 amount')
 *
 * parameters
 * //^?
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @category ABI
 */
export * as AbiParameters from './AbiParameters.js'

/**
 * Utilities & types for working with Account Proofs as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml)
 *
 * @category Execution API
 */
export * as AccountProof from './AccountProof.js'

/**
 * Utility functions for working with Ethereum addresses.
 *
 * @example
 * ### Instantiating Addresses
 *
 * An {@link ox#Address.Address} can be instantiated from a hex string using {@link ox#Address.(from:function)}:
 *
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * const address = Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @example
 * ### Validating Addresses
 *
 * The {@link ox#Address.(isAddress:function)} function will return `true` if the address is valid, and `false` otherwise:
 *
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * const valid = Address.isAddress('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
 * // @log: true
 * ```
 *
 * The {@link ox#Address.(assert:function)} function will throw an error if the address is invalid:
 *
 * ```ts twoslash
 * import { Address } from 'ox'
 *
 * Address.assert('0xdeadbeef')
 * // @error: InvalidAddressError: Address "0xdeadbeef" is invalid.
 * ```
 *
 * @example
 * ### Addresses from ECDSA Public Keys
 *
 * An {@link ox#Address.Address} can be computed from an ECDSA public key using {@link ox#Address.(fromPublicKey:function)}:
 *
 * ```ts twoslash
 * import { Address, Secp256k1 } from 'ox'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * const publicKey = Secp256k1.getPublicKey({ privateKey })
 *
 * const address = Address.fromPublicKey(publicKey)
 * // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
 * ```
 *
 * @category Addresses
 */
export * as Address from './Address.js'

/**
 * Utilities & types for working with AES-GCM encryption. Internally uses the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).
 *
 * @example
 * ### Encrypting Data
 *
 * Data can be encrypted using {@link ox#AesGcm.(encrypt:function)}:
 *
 * ```ts twoslash
 * import { AesGcm, Bytes } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const secret = Bytes.fromString('i am a secret message')
 *
 * const encrypted = await AesGcm.encrypt(secret, key) // [!code focus]
 * // @log: Uint8Array [123, 79, 183, 167, 163, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166]
 * ```
 *
 * @example
 * ### Decrypting Data
 *
 * Data can be decrypted using {@link ox#AesGcm.(decrypt:function)}:
 *
 * ```ts twoslash
 * import { AesGcm, Bytes } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const encrypted = Bytes.from([123, 79, 183, 167, 163, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166])
 *
 * const decrypted = await AesGcm.decrypt(encrypted, key) // [!code focus]
 * // @log: Bytes.fromString('i am a secret message')
 * ```
 *
 * @category Crypto
 */
export * as AesGcm from './AesGcm.js'

/**
 * Utility functions for working with [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization lists & tuples.
 *
 * @example
 * ### Instantiating Authorizations
 *
 * An Authorization can be instantiated using {@link ox#Authorization.(from:function)}:
 *
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 * ```
 *
 * @example
 * ### Computing Sign Payload
 *
 * A signing payload can be computed using {@link ox#Authorization.(getSignPayload:function)}. The result can then be passed to signing functions like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * import { Authorization, Secp256k1 } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 *
 * const payload = Authorization.getSignPayload(authorization) // [!code focus]
 *
 * const signature = Secp256k1.sign({
 *   payload,
 *   privateKey: '0x...',
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures to Authorizations
 *
 * A signature can be attached to an Authorization using {@link ox#Authorization.(from:function)}:
 *
 * ```ts twoslash
 * import { Authorization, Secp256k1, TransactionEnvelope, Value } from 'ox'
 *
 * const authorization = Authorization.from({
 *   contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: Authorization.getSignPayload(authorization),
 *   privateKey: '0x...',
 * })
 *
 * const authorization_signed = Authorization.from(authorization, { signature }) // [!code focus]
 *
 * const envelope = TransactionEnvelope.from({
 *   authorizationList: [authorization_signed],
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 *
 * @category Authorization (EIP-7702)
 */
export * as Authorization from './Authorization.js'

/**
 * Utility functions for working with [Base58](https://digitalbazaar.github.io/base58-spec/) values.
 *
 * @category Encoding
 */
export * as Base58 from './Base58.js'

/**
 * Utility functions for working with [RFC-4648](https://datatracker.ietf.org/doc/html/rfc4648) Base64.
 *
 * @category Encoding
 */
export * as Base64 from './Base64.js'

/**
 * Utility functions for working with [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Blobs.
 *
 * @category Blobs
 */
export * as Blobs from './Blobs.js'

/**
 * Utilities & types for working with Blocks as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/block.yaml)
 *
 * @category Execution API
 */
export * as Block from './Block.js'

/**
 * Utility functions for working with Bloom Filters as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/block.yaml)
 *
 * @category Execution API
 */
export * as Bloom from './Bloom.js'

/**
 * A set of Ethereum-related utility functions for working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances.
 *
 * @category Encoding
 */
export * as Bytes from './Bytes.js'

export * as Caches from './Caches.js'

export * as Constants from './Constants.js'

/**
 * Utility functions for computing Contract Addresses.
 *
 * @example
 * ### Computing Contract Addresses (CREATE)
 *
 * A Contract Address that was instantiated using the `CREATE` opcode can be computed using {@link ox#ContractAddress.(getCreateAddress:function)}:
 *
 * ```ts twoslash
 * import { ContractAddress } from 'ox'
 *
 * ContractAddress.getCreateAddress({
 *   from: '0x1a1e021a302c237453d3d45c7b82b19ceeb7e2e6',
 *   nonce: 0n,
 * })
 * // @log: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2'
 * ```
 *
 * @example
 * ### Computing Contract Addresses (CREATE2)
 *
 * A Contract Address that was instantiated using the `CREATE2` opcode can be computed using {@link ox#ContractAddress.(getCreate2Address:function)}:
 *
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
 * @category Addresses
 */
export * as ContractAddress from './ContractAddress.js'

/**
 * Utility functions for working with ENS names.
 *
 * @category ENS
 */
export * as Ens from './Ens.js'

export * as Errors from './Errors.js'

/**
 * Utilities & types for working with Filters as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/filter.yaml)
 *
 * @category Execution API
 */
export * as Filter from './Filter.js'

/**
 * Utility functions for hashing (keccak256, sha256, etc).
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * const value = Hash.keccak256('0xdeadbeef')
 * // '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
 * ```
 *
 * @category Crypto
 */
export * as Hash from './Hash.js'

/**
 * A set of Ethereum-related utility functions for working with hexadecimal string values (e.g. `"0xdeadbeef"`).
 *
 * @category Encoding
 */
export * as Hex from './Hex.js'

export * as Internal from './Internal.js'

/**
 * @category Execution API
 */
export * as Fee from './Fee.js'

/**
 * Utility functions for working with JSON (with support for `bigint`).
 *
 * @category JSON
 */
export * as Json from './Json.js'

/**
 * Utility functions for working with KZG Commitments.
 *
 * Mainly for [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Blobs.
 *
 * @category Blobs
 */
export * as Kzg from './Kzg.js'

/**
 * Utilities & types for working with Logs as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/receipt.yaml)
 *
 * @category Execution API
 */
export * as Log from './Log.js'

/**
 * Utilities & types for working with [EIP-191 Personal Messages](https://eips.ethereum.org/EIPS/eip-191#version-0x45-e)
 *
 * @category Signed & Typed Data
 */
export * as PersonalMessage from './PersonalMessage.js'

/**
 * Utilities & types for working with [EIP-1193 Providers](https://eips.ethereum.org/EIPS/eip-1193)
 *
 * @category Providers (EIP-1193)
 */
export * as Provider from './Provider.js'

/**
 * Utility functions for working with ECDSA public keys.
 *
 * @category Crypto
 */
export * as PublicKey from './PublicKey.js'

/**
 * Utility functions for encoding and decoding [Recursive Length Prefix](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) structures.
 *
 * @example
 * ```ts twoslash
 * import { Hex, Rlp } from 'ox'
 *
 * const data = Rlp.fromHex([Hex.fromString('hello'), Hex.fromString('world')])
 * // @log: '0xcc8568656c6c6f85776f726c64'
 *
 * const values = Rlp.toHex(data)
 * // @log: [Hex.fromString('hello'), Hex.fromString('world')]
 * ```
 *
 * @category Encoding
 */
export * as Rlp from './Rlp.js'

/**
 * Utility types & functions for working with [JSON-RPC 2.0 Requests](https://www.jsonrpc.org/specification#request_object) and Ethereum JSON-RPC methods as
 * defined on the [Ethereum API specification](https://github.com/ethereum/execution-apis)
 *
 * @category JSON-RPC
 */
export * as RpcRequest from './RpcRequest.js'

/**
 * Utility types & functions for working with [JSON-RPC 2.0 Responses](https://www.jsonrpc.org/specification#response_object)
 *
 * @category JSON-RPC
 */
export * as RpcResponse from './RpcResponse.js'

/**
 * Utility functions for [secp256k1](https://www.secg.org/sec2-v2.pdf) ECDSA cryptography.
 *
 * :::info
 *
 * The `Secp256k1` module is a friendly wrapper over [`@noble/curves/secp256k1`](https://github.com/paulmillr/noble-curves), an **audited** implementation of [secp256k1](https://www.secg.org/sec2-v2.pdf)
 *
 * :::
 *
 * @category Crypto
 */
export * as Secp256k1 from './Secp256k1.js'

/**
 * Utility functions for [NIST P256](https://csrc.nist.gov/csrc/media/events/workshop-on-elliptic-curve-cryptography-standards/documents/papers/session6-adalier-mehmet.pdf) ECDSA cryptography.
 *
 * :::info
 *
 * The `P256` module is a friendly wrapper over [`@noble/curves/p256`](https://github.com/paulmillr/noble-curves), an **audited** implementation of [P256](https://www.secg.org/sec2-v2.pdf)
 *
 * :::
 *
 * @example
 * ### Computing a Random Private Key
 *
 * A random private key can be computed using {@link ox#P256.(randomPrivateKey:function)}:
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 * // @log: '0x...'
 * ```
 *
 * @example
 * ### Getting a Public Key
 *
 * A public key can be derived from a private key using {@link ox#P256.(getPublicKey:function)}:
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 *
 * const publicKey = P256.getPublicKey({ privateKey }) // [!code focus]
 * // @log: { x: 3251...5152n, y: 1251...5152n }
 * ```
 *
 * @example
 * ### Signing a Payload
 *
 * A payload can be signed using {@link ox#P256.(sign:function)}:
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 *
 * const signature = P256.sign({ payload: '0xdeadbeef', privateKey }) // [!code focus]
 * // @log: { r: 1251...5152n, s: 1251...5152n, yParity: 1 }
 * ```
 *
 * @example
 * ### Verifying a Signature
 *
 * A signature can be verified using {@link ox#P256.(verify:function)}:
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 * const publicKey = P256.getPublicKey({ privateKey })
 * const signature = P256.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const isValid = P256.verify({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @category Crypto
 */
export * as P256 from './P256.js'

/**
 * Utility functions for working with ECDSA signatures.
 *
 * @category Crypto
 */
export * as Signature from './Signature.js'

/**
 * Utility functions for working with
 * [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
 *
 * @category Sign-In with Ethereum (EIP-4361)
 */
export * as Siwe from './Siwe.js'

/**
 * Utilities & types for working with **Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **Transaction** Module is not to be confused with the [TransactionEnvelope](/api/TransactionEnvelope) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **Transaction** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelope](/api/TransactionEnvelope) Module.
 * :::
 *
 * @category Execution API
 */
export * as Transaction from './Transaction.js'

/**
 * Utilities & types for working with **legacy Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **TransactionLegacy** Module is not to be confused with the [TransactionEnvelopeLegacy](/api/TransactionEnvelopeLegacy) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **TransactionLegacy** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelopeLegacy](/api/TransactionEnvelopeLegacy) Module.
 * :::
 *
 * @category Execution API
 */
export * as TransactionLegacy from './TransactionLegacy.js'

/**
 * Utilities & types for working with **EIP-1559 Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **TransactionEip1559** Module is not to be confused with the [TransactionEnvelopeEip1559](/api/TransactionEnvelopeEip1559) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **TransactionEip1559** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelopeEip1559](/api/TransactionEnvelopeEip1559) Module.
 * :::
 *
 * @category Execution API
 */
export * as TransactionEip1559 from './TransactionEip1559.js'

/**
 * Utilities & types for working with **EIP-2930 Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **TransactionEip2930** Module is not to be confused with the [TransactionEnvelopeEip2930](/api/TransactionEnvelopeEip2930) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **TransactionEip2930** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelopeEip2930](/api/TransactionEnvelopeEip2930) Module.
 * :::
 *
 * @category Execution API
 */
export * as TransactionEip2930 from './TransactionEip2930.js'

/**
 * Utilities & types for working with **EIP-4844 Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **TransactionEip4844** Module is not to be confused with the [TransactionEnvelopeEip4844](/api/TransactionEnvelopeEip4844) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **TransactionEip4844** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelopeEip4844](/api/TransactionEnvelopeEip4844) Module.
 * :::
 *
 * @category Execution API
 */
export * as TransactionEip4844 from './TransactionEip4844.js'

/**
 * Utilities & types for working with **EIP-7702 Transaction Responses** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml)
 *
 * :::warning
 * The **TransactionEip7702** Module is not to be confused with the [TransactionEnvelopeEip7702](/api/TransactionEnvelopeEip7702) Module.
 *
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the **TransactionEip7702** Module.
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the [TransactionEnvelopeEip7702](/api/TransactionEnvelopeEip7702) Module.
 * :::
 *
 * @category Execution API
 */
export * as TransactionEip7702 from './TransactionEip7702.js'

/**
 * Utility functions for working with **Legacy Transaction Envelopes** & [EIP-2718 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-2718)
 *
 * :::warning
 * The **TransactionEnvelope** Module is not to be confused with the [Transaction](/api/Transaction) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelope** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [Transaction](/api/Transaction) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelope from './TransactionEnvelope.js'

/**
 * Utility functions for working
 * with **Legacy Transaction Envelopes**.
 *
 * :::warning
 * The **TransactionEnvelopeLegacy** Module is not to be confused with the [TransactionLegacy](/api/TransactionLegacy) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelopeLegacy** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [TransactionLegacy](/api/TransactionLegacy) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelopeLegacy from './TransactionEnvelopeLegacy.js'

/**
 * Utility functions for working with [EIP-1559 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-1559)
 *
 * :::warning
 * The **TransactionEnvelopeEip1559** Module is not to be confused with the [TransactionEip1559](/api/TransactionEip1559) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelopeEip1559** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [TransactionEip1559](/api/TransactionEip1559) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelopeEip1559 from './TransactionEnvelopeEip1559.js'

/**
 * Utility functions for working with [EIP-2930 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-2930)
 *
 * :::warning
 * The **TransactionEnvelopeEip2930** Module is not to be confused with the [TransactionEip2930](/api/TransactionEip2930) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelopeEip2930** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [TransactionEip2930](/api/TransactionEip1559) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelopeEip2930 from './TransactionEnvelopeEip2930.js'

/**
 * Utility functions for working with [EIP-4844 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-4844)
 *
 * :::warning
 * The **TransactionEnvelopeEip4844** Module is not to be confused with the [TransactionEip4844](/api/TransactionEip4844) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelopeEip4844** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [TransactionEip4844](/api/TransactionEip4844) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelopeEip4844 from './TransactionEnvelopeEip4844.js'

/**
 * Utility functions for working with [EIP-7702 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-7702)
 *
 * :::warning
 * The **TransactionEnvelopeEip7702** Module is not to be confused with the [TransactionEip7702](/api/TransactionEip7702) Module.
 *
 * - If you are dealing with Transaction **Requests** (ie. signing & sending transactions), use the **TransactionEnvelopeEip7702** Module.
 * - If you are dealing with Transaction **Responses** (ie. from the JSON-RPC API), use the [TransactionEip7702](/api/TransactionEip7702) Module.
 * :::
 *
 * @category Transaction Envelopes
 */
export * as TransactionEnvelopeEip7702 from './TransactionEnvelopeEip7702.js'

/**
 * Utilities & types for working with **Transaction Receipts** as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/receipt.yaml)
 *
 * @category Execution API
 */
export * as TransactionReceipt from './TransactionReceipt.js'

/**
 * Utility functions for working with [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712)
 *
 * @category Signed & Typed Data
 */
export * as TypedData from './TypedData.js'

export * as Types from './Types.js'

/**
 * Utilities & types for working with [EIP-191 Validator Data](https://eips.ethereum.org/EIPS/eip-191#0x00)
 *
 * @category Signed & Typed Data
 */
export * as ValidatorData from './ValidatorData.js'

/**
 * Utility functions for displaying and parsing Ethereum Values as defined under **2.1. Value** in the [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
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
 *
 * @category Encoding
 */
export * as Value from './Value.js'

/**
 * Utility functions for [NIST P256](https://csrc.nist.gov/csrc/media/events/workshop-on-elliptic-curve-cryptography-standards/documents/papers/session6-adalier-mehmet.pdf) ECDSA cryptography using the [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
 *
 * @category Crypto
 */
export * as WebAuthnP256 from './WebAuthnP256.js'

/**
 * Utility functions for [NIST P256](https://csrc.nist.gov/csrc/media/events/workshop-on-elliptic-curve-cryptography-standards/documents/papers/session6-adalier-mehmet.pdf) ECDSA cryptography using the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 *
 * @category Crypto
 */
export * as WebCryptoP256 from './WebCryptoP256.js'

/**
 * Utilities & types for working with Withdrawals as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/withdrawal.yaml)
 *
 * @category Execution API
 */
export * as Withdrawal from './Withdrawal.js'

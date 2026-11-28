/**
 * The parts of ox its users lean on most. Each metric script repeats its lines about these items
 * as `hot-<metric>` lines, so `.agents/uphill/uphill.yaml` can give them targets ten times below what they
 * cost today, scored on their own: in the full lists, a few dozen items that miss their targets
 * hide under the p90 that each list scores.
 *
 * The list is the same on ox's main and 0.x branches, and an item a branch lacks matches nothing.
 * It ranks ox's public functions (November 2026) by their call sites in the source of 20 packages
 * that depend on ox, by how many of those packages call them and the weekly downloads of the
 * versions that do, and by how many of ox's own modules call them. The packages are viem (2.x and
 * v3), Base Account, WalletConnect, the Coinbase Wallet SDK, porto, mppx, permissionless,
 * Farcaster's mini app SDK, Tempo's accounts, CLI and SDKs, thirdweb, webauthx, wata, MetaMask's
 * smart accounts kit, Alchemy's wallet APIs, whatsabi, horcrux and Sequence. The first 40 lead
 * that ranking; the rest run inside ox on paths those packages use, or concentrate in viem v3.
 *
 * @module
 */

/** Public functions and namespaces, named as the metrics name them, such as `ox:Hex.fromNumber`. */
export const items: ReadonlySet<string> = new Set([
  // Encoding: Hex and Bytes conversions run at every boundary, and most of ox calls them.
  'ox:Hex.fromBytes',
  'ox:Hex.fromNumber',
  'ox:Hex.slice',
  'ox:Hex.size',
  'ox:Hex.concat',
  'ox:Hex.toBigInt',
  'ox:Hex.fromString',
  'ox:Hex.validate',
  'ox:Hex.random',
  'ox:Hex.padLeft',
  'ox:Hex.toNumber',
  'ox:Hex.assert',
  'ox:Bytes.fromString',
  'ox:Bytes.from',
  'ox:Bytes.concat',
  'ox:Bytes.fromNumber',
  'ox:Bytes.fromHex',
  'ox:Bytes.random',
  'ox:Bytes.toHex',
  'ox:Base64.fromBytes',
  'ox:Base64.toBytes',
  'ox:Base64.toString',
  'ox:Json.stringify',
  'ox:Rlp.fromHex',
  'ox:Rlp.toHex',
  'ox:Value.format',
  // Hashing, addresses and signatures.
  'ox:Hash.keccak256',
  'ox:Hash.sha256',
  'ox:Address.isEqual',
  'ox:Address.validate',
  'ox:Address.fromPublicKey',
  'ox:Address.checksum',
  'ox:Address.from',
  'ox:Signature.fromHex',
  'ox:Signature.toHex',
  'ox:Signature.from',
  'ox:Signature.toRpc',
  'ox:Signature.fromRpc',
  'ox:Signature.extract',
  'ox:PublicKey.toHex',
  'ox:PersonalMessage.getSignPayload',
  'ox:TypedData.getSignPayload',
  'ox:Secp256k1.getPublicKey',
  'ox:Secp256k1.sign',
  'ox:Secp256k1.recoverAddress',
  'ox:WebAuthnP256.getSignPayload',
  'ox:WebCryptoP256.sign',
  'ox:WebCryptoP256.createKeyPair',
  'ox:Ens.normalize',
  'ox/erc6492:SignatureErc6492.validate',
  'ox/erc8010:SignatureErc8010.validate',
  'ox/erc8010:SignatureErc8010.unwrap',
  // ABI: calldata, results and logs for every contract call.
  'ox:Abi.from',
  'ox:AbiParameters.encode',
  'ox:AbiParameters.decode',
  'ox:AbiParameters.from',
  'ox:AbiParameters.encodePacked',
  'ox:AbiFunction.encodeData',
  'ox:AbiFunction.decodeResult',
  'ox:AbiFunction.fromAbi',
  'ox:AbiEvent.extractLogs',
  // Tempo transactions and their signatures.
  'ox/tempo:SignatureEnvelope.serialize',
  'ox/tempo:SignatureEnvelope.from',
  'ox/tempo:SignatureEnvelope.extractAddress',
  'ox/tempo:TxEnvelopeTempo.serialize',
  'ox/tempo:TxEnvelopeTempo.deserialize',
  'ox/tempo:KeyAuthorization.fromRpc',
  // Entry points, by the files that import them.
  'ox',
  'ox/tempo',
  'ox/Hex',
  'ox/Address',
  'ox/Signature',
  'ox/TypedData',
  'ox/RpcResponse',
  'ox/Secp256k1',
  'ox/Provider',
  'ox/AbiFunction',
  'ox/AbiParameters',
  'ox/Bytes',
  'ox/Hash',
  'ox/WebAuthnP256',
  'ox/erc4337',
  'ox/erc6492',
])

/** The metrics whose hot lines `.agents/uphill/uphill.yaml` scores. */
const metrics = new Set([
  'entry-size',
  'call-time',
  'call-memory',
  'import-time',
  'import-memory',
  'instantiations',
  'fuzz-coverage',
])

/** Returns a `hot-<metric>` copy of each line about a hot item. */
export function hot(lines: readonly string[]): string[] {
  return lines.flatMap((line) => {
    const match = /^([a-z-]+) "((?:[^"\\]|\\.)*)"(.*)$/.exec(line)
    if (!match) return []
    const [, metric, item, rest] = match
    if (!metrics.has(metric!)) return []
    if (!items.has(item!.replace(/\\(.)/g, '$1'))) return []
    return [`hot-${metric} "${item}"${rest}`]
  })
}

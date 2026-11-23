import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test } from 'vp/test'
import * as exports from '../../index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "AbiConstructor",
      "AbiError",
      "AbiEvent",
      "AbiFunction",
      "AbiItem",
      "AbiParameter",
      "AbiParameters",
      "AccessList",
      "AccountProof",
      "Address",
      "AesGcm",
      "Authorization",
      "Base32",
      "Base58",
      "Base64",
      "Bech32m",
      "BinaryStateTree",
      "BlobCells",
      "Blobs",
      "Block",
      "BlockOverrides",
      "Bloom",
      "Bls",
      "BlsPoint",
      "Bytes",
      "Caches",
      "Cbor",
      "CompactSize",
      "ContractAddress",
      "CoseKey",
      "Ed25519",
      "Engine",
      "Ens",
      "Errors",
      "Fee",
      "Filter",
      "Frame",
      "FrameReceipt",
      "FrameRequest",
      "FrameSignature",
      "Hash",
      "HdKey",
      "Hex",
      "Json",
      "Keystore",
      "Kzg",
      "Log",
      "MlDsa44",
      "Mnemonic",
      "P256",
      "PersonalMessage",
      "Prf",
      "Provider",
      "PublicKey",
      "Rlp",
      "RpcRequest",
      "RpcResponse",
      "RpcSchema",
      "RpcTransport",
      "Secp256k1",
      "Signature",
      "Siwe",
      "Solidity",
      "StateOverrides",
      "Transaction",
      "TransactionReceipt",
      "TransactionRequest",
      "TransactionEnvelope",
      "TxEnvelopeEip1559",
      "TxEnvelopeEip2930",
      "TxEnvelopeEip4844",
      "TxEnvelopeEip7702",
      "TxEnvelopeEip8141",
      "TxEnvelopeLegacy",
      "TypedData",
      "ValidatorData",
      "Value",
      "WebAuthn",
      "WebAuthnP256",
      "WebCryptoP256",
      "Withdrawal",
      "X25519",
    ]
  `)
})

test('behavior: modules import each other, not an entry point', () => {
  // Importing a barrel such as `../index.js` loads every module it exports, and
  // CommonJS bundles keep all of them.
  const root = path.resolve(import.meta.dirname, '../..')
  const offenders = fs
    .globSync('**/*.ts', { cwd: root })
    .filter(
      (file) =>
        !/(^|\/)_test\/|(^|\/)index(\.docs)?\.ts$|\.(test|test-d|snap-d|bench)\.ts$/.test(
          file,
        ),
    )
    .filter((file) =>
      /^import (?!type )[^;]*from '(\.\.?\/)+index\.js'/m.test(
        fs.readFileSync(path.join(root, file), 'utf8'),
      ),
    )
  expect(offenders).toEqual([])
})

test('behavior: modules declare no runtime namespaces', () => {
  // A namespace that holds values compiles to an IIFE at the top of its module,
  // which bundlers cannot drop, so every bundle that imports anything from the
  // module carries the namespace's code. `UserOperation.toTypedData.types` is
  // public, so it stays.
  const root = path.resolve(import.meta.dirname, '../..')
  const offenders = fs
    .globSync('**/*.ts', { cwd: root })
    .filter(
      (file) =>
        !/(^|\/)_test\/|\.(test|test-d|snap-d|bench|bench-d)\.ts$/.test(file),
    )
    .filter((file) =>
      /^(export )?namespace /m.test(
        fs.readFileSync(path.join(root, file), 'utf8'),
      ),
    )
  expect(offenders).toEqual(['erc4337/UserOperation.ts'])
})

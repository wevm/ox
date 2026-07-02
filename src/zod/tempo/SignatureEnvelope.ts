/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_SignatureEnvelope from '../../tempo/SignatureEnvelope.js'
import * as core_Hex from '../../core/Hex.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_MultisigConfig from './MultisigConfig.js'
import * as z from 'zod/mini'

/** Signature envelope key type schema. */
export const Type = z.union([
  z.literal('secp256k1'),
  z.literal('p256'),
  z.literal('webAuthn'),
])

/** Keychain signature version schema. */
export const KeychainVersion = z.union([z.literal('v1'), z.literal('v2')])

/** Uncompressed public key schema. */
export const PublicKey = z.object({
  prefix: z
    .number()
    .check(z.refine((value) => value === 4, 'expected uncompressed prefix')),
  x: z_Hex.Hex32,
  y: z_Hex.Hex32,
})

const RecoveredSignature = z.object({
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  yParity: z
    .number()
    .check(z.refine((value) => value === 0 || value === 1, 'expected yParity')),
})

const Signature = z.object({
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
})

/** RPC secp256k1 signature envelope schema. */
export const Secp256k1Rpc = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  type: z.literal('secp256k1'),
  v: z.optional(z_Hex.Hex),
  yParity: z.optional(z_Hex.Hex),
})

/** RPC P256 signature envelope schema. */
export const P256Rpc = z.object({
  preHash: z.boolean(),
  pubKeyX: z_Hex.Hex,
  pubKeyY: z_Hex.Hex,
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  type: z.literal('p256'),
})

/** RPC WebAuthn signature envelope schema. */
export const WebAuthnRpc = z.object({
  pubKeyX: z_Hex.Hex,
  pubKeyY: z_Hex.Hex,
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  type: z.literal('webAuthn'),
  webauthnData: z_Hex.Hex,
})

/** RPC keychain signature envelope schema. */
export const KeychainRpc = z.object({
  keyId: z.optional(z_Address.Address),
  // `signature` is recursive; type the getter concretely to break the cycle.
  signature: z.lazy(
    (): z.ZodMiniType<core_SignatureEnvelope.SignatureEnvelopeRpc> =>
      Rpc as never,
  ),
  type: z.literal('keychain'),
  userAddress: z_Address.Address,
  version: z.optional(KeychainVersion),
})

/** RPC native multisig signature envelope schema. */
export const MultisigRpc = z.object({
  account: z_Address.Address,
  init: z.optional(z_MultisigConfig.Config),
  // Owner approvals are raw serialized signatures (node `Vec<Bytes>`).
  signatures: z.readonly(z.array(z_Hex.Hex)),
  type: z.literal('multisig'),
})

/** RPC signature envelope schema. */
export const Rpc = z.union([
  Secp256k1Rpc,
  P256Rpc,
  WebAuthnRpc,
  KeychainRpc,
  MultisigRpc,
])

/** secp256k1 signature envelope schema. */
export const Secp256k1 = z.object({
  signature: RecoveredSignature,
  type: z.literal('secp256k1'),
})

/** P256 signature envelope schema. */
export const P256 = z.object({
  prehash: z.boolean(),
  publicKey: PublicKey,
  signature: Signature,
  type: z.literal('p256'),
})

/** WebAuthn signature envelope schema. */
export const WebAuthn = z.object({
  metadata: z.object({
    authenticatorData: z_Hex.Hex,
    clientDataJSON: z.string(),
  }),
  publicKey: PublicKey,
  signature: Signature,
  type: z.literal('webAuthn'),
})

/** Keychain signature envelope schema. */
export const Keychain = z.object({
  // `inner` is recursive; type the getter concretely to break the cycle.
  inner: z.lazy(
    (): z.ZodMiniType<core_SignatureEnvelope.SignatureEnvelope> =>
      Domain as never,
  ),
  keyId: z.optional(z_Address.Address),
  type: z.literal('keychain'),
  userAddress: z_Address.Address,
  version: z.optional(KeychainVersion),
})

/** Native multisig signature envelope schema. */
export const Multisig = z.object({
  account: z_Address.Address,
  init: z.optional(z_MultisigConfig.Config),
  // `signatures` is recursive; type the getter concretely to break the cycle.
  signatures: z.lazy(
    (): z.ZodMiniType<readonly core_SignatureEnvelope.SignatureEnvelope[]> =>
      z.readonly(z.array(Domain)) as never,
  ),
  type: z.literal('multisig'),
})

/** Decoded signature envelope schema. */
export const Domain = z.union([Secp256k1, P256, WebAuthn, Keychain, Multisig])

/** Codec decoding an RPC signature envelope into a signature envelope. */
export const SignatureEnvelope = z.codec(Rpc, Domain, {
  decode: (value) => fromRpc(value as never) as never,
  encode: (value) => toRpc(value as never) as never,
})

/** Hex-encoded serialized signature envelope schema. */
export const Serialized = z_Hex.Hex

/** Recursively decodes an RPC signature envelope into a signature envelope. */
function fromRpc(
  value: core_SignatureEnvelope.SignatureEnvelopeRpc,
): core_SignatureEnvelope.SignatureEnvelope {
  if (value.type === 'secp256k1') {
    const secp256k1 = value as core_SignatureEnvelope.Secp256k1Rpc
    return {
      signature: {
        r: core_Hex.padLeft(secp256k1.r, 32),
        s: core_Hex.padLeft(secp256k1.s, 32),
        yParity: toYParity(secp256k1.v, secp256k1.yParity),
      },
      type: 'secp256k1',
    }
  }

  if (value.type === 'p256') {
    const p256 = value as core_SignatureEnvelope.P256Rpc
    return {
      prehash: p256.preHash,
      publicKey: {
        prefix: 4,
        x: core_Hex.padLeft(p256.pubKeyX, 32),
        y: core_Hex.padLeft(p256.pubKeyY, 32),
      },
      signature: {
        r: core_Hex.padLeft(p256.r, 32),
        s: core_Hex.padLeft(p256.s, 32),
      },
      type: 'p256',
    }
  }

  if (value.type === 'webAuthn') {
    const webAuthn = value as core_SignatureEnvelope.WebAuthnRpc
    return {
      metadata: parseWebauthnData(webAuthn.webauthnData),
      publicKey: {
        prefix: 4,
        x: core_Hex.padLeft(webAuthn.pubKeyX, 32),
        y: core_Hex.padLeft(webAuthn.pubKeyY, 32),
      },
      signature: {
        r: core_Hex.padLeft(webAuthn.r, 32),
        s: core_Hex.padLeft(webAuthn.s, 32),
      },
      type: 'webAuthn',
    }
  }

  if (value.type === 'multisig')
    return core_SignatureEnvelope.fromRpc(
      value as core_SignatureEnvelope.MultisigRpc,
    )

  const keychain = value as core_SignatureEnvelope.KeychainRpc
  return {
    inner: fromRpc(keychain.signature),
    type: 'keychain',
    userAddress: keychain.userAddress,
    ...(keychain.keyId ? { keyId: keychain.keyId } : {}),
    ...(keychain.version ? { version: keychain.version } : {}),
  }
}

/** Recursively encodes a signature envelope into an RPC signature envelope. */
function toRpc(
  value: core_SignatureEnvelope.SignatureEnvelope,
): core_SignatureEnvelope.SignatureEnvelopeRpc {
  if (value.type === 'secp256k1') {
    const secp256k1 = value as core_SignatureEnvelope.Secp256k1
    return {
      r: secp256k1.signature.r,
      s: secp256k1.signature.s,
      type: 'secp256k1',
      yParity: secp256k1.signature.yParity === 0 ? '0x0' : '0x1',
    }
  }

  if (value.type === 'p256') {
    const p256 = value as core_SignatureEnvelope.P256
    return {
      preHash: p256.prehash,
      pubKeyX: p256.publicKey.x,
      pubKeyY: p256.publicKey.y as core_Hex.Hex,
      r: p256.signature.r,
      s: p256.signature.s,
      type: 'p256',
    }
  }

  if (value.type === 'webAuthn') {
    const webAuthn = value as core_SignatureEnvelope.WebAuthn
    return {
      pubKeyX: webAuthn.publicKey.x,
      pubKeyY: webAuthn.publicKey.y as core_Hex.Hex,
      r: webAuthn.signature.r,
      s: webAuthn.signature.s,
      type: 'webAuthn',
      webauthnData: core_Hex.concat(
        webAuthn.metadata.authenticatorData,
        core_Hex.fromString(webAuthn.metadata.clientDataJSON),
      ),
    }
  }

  if (value.type === 'multisig')
    return core_SignatureEnvelope.toRpc(
      value as core_SignatureEnvelope.Multisig,
    )

  const keychain = value as core_SignatureEnvelope.Keychain
  return {
    signature: toRpc(keychain.inner),
    type: 'keychain',
    userAddress: keychain.userAddress,
    ...(keychain.keyId ? { keyId: keychain.keyId } : {}),
    ...(keychain.version ? { version: keychain.version } : {}),
  }
}

/** Computes a `yParity` value from RPC `v`/`yParity` fields. */
function toYParity(
  v: core_Hex.Hex | undefined,
  yParity: core_Hex.Hex | undefined,
) {
  const v_ = v ? Number(v) : undefined
  let yParity_ = yParity ? Number(yParity) : undefined
  if (typeof v_ === 'number' && typeof yParity_ !== 'number') {
    if (v_ === 0 || v_ === 27) yParity_ = 0
    else if (v_ === 1 || v_ === 28) yParity_ = 1
    else if (v_ >= 35) yParity_ = v_ % 2 === 0 ? 1 : 0
  }
  return yParity_ as 0 | 1
}

/** Parses concatenated WebAuthn metadata into its component parts. */
function parseWebauthnData(webauthnData: core_Hex.Hex) {
  const size = core_Hex.size(webauthnData)
  for (let split = 37; split < size; split++) {
    const potentialJson = core_Hex.toString(core_Hex.slice(webauthnData, split))
    if (potentialJson.startsWith('{') && potentialJson.endsWith('}')) {
      try {
        JSON.parse(potentialJson)
        return {
          authenticatorData: core_Hex.slice(webauthnData, 0, split),
          clientDataJSON: potentialJson,
        }
      } catch {}
    }
  }
  throw new Error(
    'Unable to parse WebAuthn metadata: could not extract valid authenticatorData and clientDataJSON',
  )
}

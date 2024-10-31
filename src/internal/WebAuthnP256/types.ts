import type * as PublicKey from '../../PublicKey.js'
import type { Hex } from '../../Hex.js'
import type { Compute } from '../types.js'

/** A WebAuthn-flavored P256 credential. */
export type WebAuthnP256_P256Credential = {
  id: string
  publicKey: PublicKey.PublicKey
  raw: PublicKeyCredential
}

/** Metadata for a WebAuthn P256 signature. */
export type WebAuthnP256_SignMetadata = Compute<{
  authenticatorData: Hex
  challengeIndex: number
  clientDataJSON: string
  typeIndex: number
  userVerificationRequired: boolean
}>

////////////////////////////////////////////////////////////////////////
// Web Authentication API
////////////////////////////////////////////////////////////////////////

/** @internal */
export type AttestationConveyancePreference =
  | 'direct'
  | 'enterprise'
  | 'indirect'
  | 'none'

/** @internal */
export type AuthenticatorAttachment = 'cross-platform' | 'platform'

/** @internal */
export type AuthenticatorTransport =
  | 'ble'
  | 'hybrid'
  | 'internal'
  | 'nfc'
  | 'usb'

/** @internal */
export type COSEAlgorithmIdentifier = number

/** @internal */
export type CredentialMediationRequirement =
  | 'conditional'
  | 'optional'
  | 'required'
  | 'silent'

/** @internal */
export type PublicKeyCredentialType = 'public-key'

/** @internal */
export type ResidentKeyRequirement = 'discouraged' | 'preferred' | 'required'

/** @internal */
export type UserVerificationRequirement =
  | 'discouraged'
  | 'preferred'
  | 'required'

/** @internal */
export type LargeBlobSupport = {
  support: 'required' | 'preferred'
}

/** @internal */
export type BufferSource = ArrayBufferView | ArrayBuffer

/** @internal */
export type PrfExtension = Record<'eval', Record<'first', Uint8Array>>

/** @internal */
export interface AuthenticationExtensionsClientInputs {
  appid?: string
  credProps?: boolean
  hmacCreateSecret?: boolean
  minPinLength?: boolean
  prf?: PrfExtension
  largeBlob?: LargeBlobSupport
}

/** @internal */
export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment
  requireResidentKey?: boolean
  residentKey?: ResidentKeyRequirement
  userVerification?: UserVerificationRequirement
}

/** @internal */
export interface Credential {
  readonly id: string
  readonly type: string
}

/** @internal */
export interface CredentialCreationOptions {
  publicKey?: PublicKeyCredentialCreationOptions
  signal?: AbortSignal
}

/** @internal */
export interface CredentialRequestOptions {
  mediation?: CredentialMediationRequirement
  publicKey?: PublicKeyCredentialRequestOptions
  signal?: AbortSignal
}

/** @internal */
export interface PublicKeyCredential extends Credential {
  readonly authenticatorAttachment: string | null
  readonly rawId: ArrayBuffer
  readonly response: AuthenticatorResponse
  getClientExtensionResults(): AuthenticationExtensionsClientOutputs
}

/** @internal */
export interface PublicKeyCredentialCreationOptions {
  attestation?: AttestationConveyancePreference
  authenticatorSelection?: AuthenticatorSelectionCriteria
  challenge: BufferSource
  excludeCredentials?: PublicKeyCredentialDescriptor[]
  extensions?: AuthenticationExtensionsClientInputs
  pubKeyCredParams: PublicKeyCredentialParameters[]
  rp: PublicKeyCredentialRpEntity
  timeout?: number
  user: PublicKeyCredentialUserEntity
}

/** @internal */
export interface PublicKeyCredentialDescriptor {
  id: BufferSource
  transports?: AuthenticatorTransport[]
  type: PublicKeyCredentialType
}

/** @internal */
export interface PublicKeyCredentialEntity {
  name: string
}

/** @internal */
export interface PublicKeyCredentialParameters {
  alg: COSEAlgorithmIdentifier
  type: PublicKeyCredentialType
}

/** @internal */
export interface PublicKeyCredentialRequestOptions {
  allowCredentials?: PublicKeyCredentialDescriptor[]
  challenge: BufferSource
  extensions?: AuthenticationExtensionsClientInputs
  rpId?: string
  timeout?: number
  userVerification?: UserVerificationRequirement
}

/** @internal */
export interface PublicKeyCredentialRpEntity extends PublicKeyCredentialEntity {
  id?: string
}

/** @internal */
export interface PublicKeyCredentialUserEntity
  extends PublicKeyCredentialEntity {
  displayName: string
  id: BufferSource
}

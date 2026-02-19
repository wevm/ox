import type * as Hex from '../core/Hex.js'

export type AttestationConveyancePreference =
  | 'direct'
  | 'enterprise'
  | 'indirect'
  | 'none'

export type AuthenticatorAttachment = 'cross-platform' | 'platform'

export type AuthenticatorTransport =
  | 'ble'
  | 'hybrid'
  | 'internal'
  | 'nfc'
  | 'usb'

export type COSEAlgorithmIdentifier = number

export type CredentialMediationRequirement =
  | 'conditional'
  | 'optional'
  | 'required'
  | 'silent'

export type PublicKeyCredentialType = 'public-key'

export type ResidentKeyRequirement = 'discouraged' | 'preferred' | 'required'

export type UserVerificationRequirement =
  | 'discouraged'
  | 'preferred'
  | 'required'

export type LargeBlobSupport = {
  support: 'required' | 'preferred'
}

export type BufferSource = ArrayBufferView | ArrayBuffer

export type PrfExtension = Record<'eval', Record<'first', Uint8Array>>

export interface AuthenticationExtensionsClientInputs<
  serialized extends boolean = false,
> {
  appid?: string
  credProps?: boolean
  hmacCreateSecret?: boolean
  minPinLength?: boolean
  prf?: serialized extends true ? { eval: { first: string } } : PrfExtension
  largeBlob?: LargeBlobSupport
}

export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment
  requireResidentKey?: boolean
  residentKey?: ResidentKeyRequirement
  userVerification?: UserVerificationRequirement
}

/**
 * Available only in secure contexts.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AuthenticatorAttestationResponse)
 */
export interface AuthenticatorAttestationResponse<
  serialized extends boolean = false,
> extends AuthenticatorResponse<serialized> {
  readonly attestationObject: serialized extends true ? string : ArrayBuffer
  getAuthenticatorData(): ArrayBuffer
  getPublicKey(): ArrayBuffer | null
  getPublicKeyAlgorithm(): COSEAlgorithmIdentifier
  getTransports(): string[]
}

export interface AuthenticatorResponse<serialized extends boolean = false> {
  readonly clientDataJSON: serialized extends true ? string : ArrayBuffer
}

export interface Credential {
  readonly id: string
  readonly type: string
}

export interface CredentialCreationOptions<serialized extends boolean = false> {
  publicKey?: PublicKeyCredentialCreationOptions<serialized>
  signal?: AbortSignal
}

export interface CredentialRequestOptions<serialized extends boolean = false> {
  mediation?: CredentialMediationRequirement
  publicKey?: PublicKeyCredentialRequestOptions<serialized>
  signal?: AbortSignal
}

export type PublicKeyCredential<serialized extends boolean = false> =
  Credential & {
    readonly authenticatorAttachment: string | null
    readonly rawId: serialized extends true ? string : ArrayBuffer
    readonly response: AuthenticatorResponse<serialized>
  } & (serialized extends true
      ? {}
      : {
          getClientExtensionResults(): AuthenticationExtensionsClientOutputs
        })

export interface PublicKeyCredentialCreationOptions<
  serialized extends boolean = false,
> {
  attestation?: AttestationConveyancePreference
  authenticatorSelection?: AuthenticatorSelectionCriteria
  challenge: serialized extends true ? Hex.Hex : BufferSource
  excludeCredentials?: PublicKeyCredentialDescriptor<serialized>[]
  extensions?: AuthenticationExtensionsClientInputs<serialized>
  pubKeyCredParams: PublicKeyCredentialParameters[]
  rp: PublicKeyCredentialRpEntity
  timeout?: number
  user: PublicKeyCredentialUserEntity<serialized>
}

export interface PublicKeyCredentialDescriptor<
  serialized extends boolean = false,
> {
  id: serialized extends true ? string : BufferSource
  transports?: AuthenticatorTransport[]
  type: PublicKeyCredentialType
}

export interface PublicKeyCredentialEntity {
  name: string
}

export interface PublicKeyCredentialParameters {
  alg: COSEAlgorithmIdentifier
  type: PublicKeyCredentialType
}

export interface PublicKeyCredentialRequestOptions<
  serialized extends boolean = false,
> {
  allowCredentials?: PublicKeyCredentialDescriptor<serialized>[]
  challenge: serialized extends true ? Hex.Hex : BufferSource
  extensions?: AuthenticationExtensionsClientInputs<serialized>
  rpId?: string
  timeout?: number
  userVerification?: UserVerificationRequirement
}

export interface PublicKeyCredentialRpEntity extends PublicKeyCredentialEntity {
  id: string
}

export interface PublicKeyCredentialUserEntity<
  serialized extends boolean = false,
> extends PublicKeyCredentialEntity {
  displayName: string
  id: serialized extends true ? string : BufferSource
}

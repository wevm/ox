import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { UnionOmit } from './internal/types.js'
import * as WebAuthnP256 from './WebAuthnP256.js'
import * as Authentication from '../webauthn/Authentication.js'
import type * as Credential from '../webauthn/Credential.js'
import * as Registration from '../webauthn/Registration.js'
import type * as Types from '../webauthn/Types.js'

export * from './WebAuthnP256.js'

const defaultPrfInput = Bytes.fromString('ox.webauthn.prf.v1')

/** Configuration for evaluating a WebAuthn credential-bound PRF. */
export type Prf =
  | true
  | {
      /**
       * Application-owned PRF input.
       *
       * Use the same input to reproduce an output. Store unpredictable inputs
       * with the credential metadata.
       */
      input: Bytes.Bytes
    }

/**
 * Creates a WebAuthn credential and optionally returns its credential-bound
 * PRF output.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, WebAuthn } from 'ox'
 *
 * const credential = await WebAuthn.createCredential({
 *   name: 'Example',
 *   prf: true
 * })
 * const privateKey = Secp256k1.fromPrf(credential.prf)
 * ```
 *
 * `prf: true` uses the stable input `ox.webauthn.prf.v1`. Pass
 * `{ input }` to use an application-owned input instead.
 *
 * When credential creation enables PRF but does not return an output, this
 * function performs a follow-up assertion. The user may be prompted twice.
 *
 * If PRF evaluation fails after registration, the thrown error retains the
 * created credential on its `credential` property.
 *
 * :::warning
 *
 * PRF output is secret application-held key material. Native
 * `credential.raw.toJSON()` output includes extension results, so do not
 * serialize or send the raw credential.
 *
 * PRF-derived keys are software keys. Code on any origin allowed to use the
 * same RP ID can request the same output after user verification.
 *
 * :::
 *
 * @param options - Credential creation and PRF options.
 * @returns The credential, with a copied PRF output when requested.
 */
export async function createCredential<
  const options extends createCredential.Options | createCredential.PrfOptions,
>(options: options): Promise<createCredential.ReturnType<options>> {
  if (!('prf' in options) || options.prf === undefined)
    return WebAuthnP256.createCredential(options) as never
  if ('publicKey' in options) throw new InvalidOptionsError()

  const rpId = options.rp?.id
  const {
    authenticatorSelection = {
      requireResidentKey: true,
      residentKey: 'required',
    },
    challenge = Hex.random(32),
    createFn,
    extensions,
    getFn,
    prf,
    timeout,
    ...rest
  } = options
  assertExtensions(extensions)

  const input = getPrfInput(prf)
  const credential = await Registration.create({
    ...rest,
    authenticatorSelection: {
      ...authenticatorSelection,
      userVerification: 'required',
    },
    challenge,
    ...(createFn && { createFn }),
    extensions: {
      ...extensions,
      prf: {
        eval: {
          first: input,
        },
      },
    },
    ...(timeout !== undefined && { timeout }),
  } as Registration.create.Options)

  const result = (() => {
    try {
      return credential.raw.getClientExtensionResults().prf
    } catch (cause) {
      throw new PrfEvaluationFailedError({
        cause: cause as Error,
        credential,
      })
    }
  })()
  const output = result?.results?.first
  if (output !== undefined)
    return {
      ...credential,
      prf: parsePrfOutput(output, {
        credential,
      }),
    } as never

  if (result?.enabled !== true)
    throw new PrfNotSupportedError({
      credential,
    })

  try {
    const result = await getCredential({
      credentialId: credential.id,
      ...(getFn && { getFn }),
      prf: {
        input,
      },
      ...(rpId && { rpId }),
      ...(timeout !== undefined && { timeout }),
    })
    if (result.id !== credential.id)
      throw new Error(
        `Expected credential "${credential.id}", but received "${result.id}".`,
      )
    return {
      ...credential,
      prf: result.prf,
    } as never
  } catch (cause) {
    throw new PrfEvaluationFailedError({
      cause: cause as Error,
      credential,
    })
  }
}

export declare namespace createCredential {
  /** Options for ordinary WebAuthn P256 credential creation. */
  type Options = Registration.create.Options & {
    /** Reserved for credential creation with PRF output. */
    prf?: never
  }

  /** Options for WebAuthn credential creation with required PRF output. */
  type PrfOptions = UnionOmit<
    Registration.getOptions.Options,
    'authenticatorSelection' | 'challenge' | 'extensions'
  > & {
    /**
     * Criteria used to select an authenticator. User verification is always required.
     */
    authenticatorSelection?:
      | Omit<
          NonNullable<
            Registration.getOptions.Options['authenticatorSelection']
          >,
          'userVerification'
        >
      | undefined
    /**
     * Cryptographic challenge. Defaults to a random 32-byte value.
     *
     * Supply and verify a server-generated challenge when registration is
     * also used to authenticate a user to a server.
     */
    challenge?: Registration.getOptions.Options['challenge'] | undefined
    /** Function that creates the WebAuthn credential. */
    createFn?:
      | ((
          options?: Types.CredentialCreationOptions,
        ) => Promise<Types.Credential | null>)
      | undefined
    /** Additional WebAuthn extensions. The `prf` extension is managed by this function. */
    extensions?:
      | Omit<Types.AuthenticationExtensionsClientInputs, 'prf'>
      | undefined
    /** Function used for a follow-up PRF assertion when creation does not return an output. */
    getFn?:
      | ((
          options?: Types.CredentialRequestOptions,
        ) => Promise<Types.Credential | null>)
      | undefined
    /** Credential-bound PRF configuration. */
    prf: Prf
    /** Raw credential options cannot be combined with managed PRF evaluation. */
    publicKey?: never
  }

  /** Created WebAuthn credential with its credential-bound PRF output. */
  type PrfReturnType = Credential.Credential & {
    /** Copied 32-byte credential-bound PRF output. */
    prf: Bytes.Bytes
  }

  /** Return type for a WebAuthn credential creation request. */
  type ReturnType<options extends Options | PrfOptions> =
    options extends PrfOptions ? PrfReturnType : Credential.Credential

  type ErrorType =
    | InvalidExtensionError
    | InvalidOptionsError
    | InvalidPrfOutputError
    | PrfEvaluationFailedError
    | PrfNotSupportedError
    | Registration.create.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Requests a WebAuthn credential and returns its credential-bound PRF output.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, WebAuthn } from 'ox'
 *
 * const { prf } = await WebAuthn.getCredential({
 *   credentialId: 'oZ48...',
 *   prf: true
 * })
 * const privateKey = Secp256k1.fromPrf(prf)
 * ```
 *
 * `prf: true` uses the stable input `ox.webauthn.prf.v1`. Pass
 * `{ input }` to use an application-owned input instead.
 *
 * When more than one credential can be selected, check `result.id`
 * before using the PRF output.
 *
 * :::warning
 *
 * PRF output is secret application-held key material. Native
 * `response.raw.toJSON()` output includes extension results, so do not
 * serialize or send the raw response.
 *
 * :::
 *
 * @param options - Credential request and PRF options.
 * @returns The requested credential and a copied 32-byte PRF output.
 */
export async function getCredential(
  options: getCredential.Options,
): Promise<getCredential.ReturnType> {
  if ('publicKey' in options) throw new InvalidOptionsError()

  const {
    challenge = Hex.random(32),
    extensions,
    getFn = (options: Types.CredentialRequestOptions | undefined) =>
      window.navigator.credentials.get(options as never),
    prf,
    ...rest
  } = options
  assertExtensions(extensions)

  const input = getPrfInput(prf)
  const request = Authentication.getOptions({
    ...rest,
    challenge,
    extensions: {
      ...extensions,
      prf: {
        eval: {
          first: input,
        },
      },
    },
    userVerification: 'required',
  })
  const raw = await (async () => {
    try {
      return (await getFn(request)) as Types.PublicKeyCredential | null
    } catch (cause) {
      throw new GetCredentialFailedError({
        cause: cause as Error,
      })
    }
  })()
  if (!raw) throw new GetCredentialFailedError()

  const response = {
    id: raw.id,
    raw,
  }

  const output = (() => {
    try {
      return response.raw.getClientExtensionResults().prf?.results?.first
    } catch (cause) {
      throw new PrfEvaluationFailedError({
        cause: cause as Error,
        response,
      })
    }
  })()
  if (output === undefined)
    throw new PrfUnavailableError({
      response,
    })

  return {
    ...response,
    prf: parsePrfOutput(output, {
      response,
    }),
  }
}

export declare namespace getCredential {
  type Options = UnionOmit<
    Authentication.getOptions.Options,
    'challenge' | 'extensions' | 'userVerification'
  > & {
    /**
     * Challenge to sign. Defaults to a random 32-byte value.
     *
     * Supply and verify a server-generated challenge when the assertion is
     * also used to authenticate a user to a server.
     */
    challenge?: Hex.Hex | undefined
    /** Additional WebAuthn extensions. The `prf` extension is managed by this function. */
    extensions?:
      | Omit<Types.AuthenticationExtensionsClientInputs, 'prf'>
      | undefined
    /** Function that requests the WebAuthn credential. */
    getFn?:
      | ((
          options?: Types.CredentialRequestOptions,
        ) => Promise<Types.Credential | null>)
      | undefined
    /** Credential-bound PRF configuration. */
    prf: Prf
    /** Raw credential options cannot be combined with managed PRF evaluation. */
    publicKey?: never
  }

  /** Result from a WebAuthn credential request. */
  type Response = {
    /** Credential identifier. */
    id: string
    /** Native WebAuthn credential. */
    raw: Types.PublicKeyCredential
  }

  type ReturnType = Response & {
    /** Copied 32-byte credential-bound PRF output. */
    prf: Bytes.Bytes
  }

  type ErrorType =
    | Authentication.getOptions.ErrorType
    | GetCredentialFailedError
    | InvalidExtensionError
    | InvalidOptionsError
    | InvalidPrfOutputError
    | PrfEvaluationFailedError
    | PrfUnavailableError
    | Errors.GlobalErrorType
}

function getPrfInput(prf: Prf): Bytes.Bytes {
  return (prf === true ? defaultPrfInput : prf.input).slice()
}

type PrfResultContext = {
  credential?: Credential.Credential | undefined
  response?: getCredential.Response | undefined
}

function parsePrfOutput(
  value: unknown,
  context: PrfResultContext,
): Bytes.Bytes {
  if (ArrayBuffer.isView(value)) {
    if (value.byteLength !== 32)
      throw new InvalidPrfOutputError({
        ...context,
        size: value.byteLength,
      })
    return new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    ).slice()
  }

  const arrayBufferSize = getArrayBufferSize(value)
  if (arrayBufferSize !== undefined) {
    if (arrayBufferSize !== 32)
      throw new InvalidPrfOutputError({
        ...context,
        size: arrayBufferSize,
      })
    return new Uint8Array(value as ArrayBuffer).slice()
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'length' in value &&
    typeof value.length === 'number'
  ) {
    if (value.length !== 32)
      throw new InvalidPrfOutputError({
        ...context,
        size: value.length,
      })

    const output = new Uint8Array(32)
    for (let index = 0; index < output.length; index++) {
      const byte = (value as ArrayLike<unknown>)[index]
      if (
        typeof byte !== 'number' ||
        !Number.isInteger(byte) ||
        byte < 0 ||
        byte > 255
      )
        throw new InvalidPrfOutputError(context)
      output[index] = byte
    }
    return output
  }

  throw new InvalidPrfOutputError(context)
}

function getArrayBufferSize(value: unknown): number | undefined {
  try {
    return Object.getOwnPropertyDescriptor(
      ArrayBuffer.prototype,
      'byteLength',
    )?.get?.call(value)
  } catch {
    return undefined
  }
}

function assertExtensions(
  extensions: Types.AuthenticationExtensionsClientInputs | undefined,
) {
  if (extensions?.prf) throw new InvalidExtensionError()
}

/** Thrown when a caller supplies the managed `prf` extension. */
export class InvalidExtensionError extends Errors.BaseError {
  override readonly name = 'WebAuthn.InvalidExtensionError'

  constructor() {
    super('The `prf` extension is managed by this function.')
  }
}

/** Thrown when raw credential options are combined with managed PRF evaluation. */
export class InvalidOptionsError extends Errors.BaseError {
  override readonly name = 'WebAuthn.InvalidOptionsError'

  constructor() {
    super(
      'The `publicKey` option cannot be combined with managed PRF evaluation.',
    )
  }
}

/** Thrown when a WebAuthn PRF result is not a valid 32-byte output. */
export class InvalidPrfOutputError extends Errors.BaseError {
  /** Credential that returned the invalid PRF output, when created in this operation. */
  readonly credential?: Credential.Credential | undefined

  /** Authentication response that returned the invalid PRF output, when available. */
  readonly response?: getCredential.Response | undefined

  override readonly name = 'WebAuthn.InvalidPrfOutputError'

  constructor({
    credential,
    response,
    size,
  }: PrfResultContext & {
    size?: number | undefined
  }) {
    super(
      size === undefined
        ? 'Expected a 32-byte PRF output.'
        : `Expected a 32-byte PRF output, but received ${size} bytes.`,
    )
    this.credential = credential
    this.response = response
  }
}

/** Thrown when a created credential does not support PRF evaluation. */
export class PrfNotSupportedError extends Errors.BaseError {
  /** Credential that was created before PRF support was determined. */
  readonly credential: Credential.Credential

  override readonly name = 'WebAuthn.PrfNotSupportedError'

  constructor({ credential }: { credential: Credential.Credential }) {
    super('The created credential does not support PRF evaluation.')
    this.credential = credential
  }
}

/** Thrown when a credential assertion does not return a PRF output. */
export class PrfUnavailableError extends Errors.BaseError {
  /** Authentication response that did not contain a PRF output. */
  readonly response: getCredential.Response

  override readonly name = 'WebAuthn.PrfUnavailableError'

  constructor({ response }: { response: getCredential.Response }) {
    super('The credential did not return a PRF output.')
    this.response = response
  }
}

/** Thrown when WebAuthn PRF evaluation fails after a credential ceremony. */
export class PrfEvaluationFailedError extends Errors.BaseError<Error> {
  /** Credential that was created before PRF evaluation failed, when available. */
  readonly credential?: Credential.Credential | undefined

  /** Authentication response produced before PRF evaluation failed, when available. */
  readonly response?: getCredential.Response | undefined

  override readonly name = 'WebAuthn.PrfEvaluationFailedError'

  constructor({
    cause,
    credential,
    response,
  }: {
    cause: Error
    credential?: Credential.Credential | undefined
    response?: getCredential.Response | undefined
  }) {
    super(
      credential
        ? 'Created a credential, but failed to evaluate its PRF.'
        : 'Failed to evaluate the credential PRF.',
      {
        cause,
      },
    )
    this.credential = credential
    this.response = response
  }
}

/** Thrown when a WebAuthn credential request fails. */
export class GetCredentialFailedError extends Errors.BaseError<Error> {
  override readonly name = 'WebAuthn.GetCredentialFailedError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to request credential.', {
      cause,
    })
  }
}

/** @entrypointCategory WebAuthn */
// biome-ignore lint/complexity/noUselessEmptyExport: tsdoc
export type {}

/**
 * Utility functions and types for WebAuthn authentication ceremonies (signing and verification).
 *
 * @category WebAuthn
 */
export * as Authentication from './Authentication.js'

/**
 * Utility functions for constructing and parsing authenticator data and client data JSON.
 *
 * @category WebAuthn
 */
export * as Authenticator from './Authenticator.js'

/**
 * Utility functions and types for WebAuthn P256 credentials.
 *
 * @category WebAuthn
 */
export * as Credential from './Credential.js'

/**
 * Utility functions and types for WebAuthn registration ceremonies (credential creation and verification).
 *
 * @category WebAuthn
 */
export * as Registration from './Registration.js'

/**
 * WebAuthn type definitions.
 *
 * @category WebAuthn
 */
export * as Types from './Types.js'

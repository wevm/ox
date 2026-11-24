import { getVersion } from './internal/errors.js'

export type GlobalErrorType<name extends string = 'Error'> = Error & {
  name: name
}

/**
 * Base error class inherited by all errors thrown by ox.
 *
 * @example
 * ```ts
 * import { Errors } from 'ox'
 * throw new Errors.BaseError('An error occurred')
 * ```
 */
export class BaseError<
  cause extends Error | undefined = undefined,
> extends Error {
  // Declared, and set in the constructor, so the build (ES2021) does not
  // emit an `Object.defineProperty` call for each field into every bundle.
  declare details: string
  declare docs?: string | undefined
  declare docsOrigin?: string | undefined
  declare docsPath?: string | undefined
  declare shortMessage: string
  declare showVersion?: boolean | undefined
  declare version?: string | undefined

  declare cause: cause
  declare name: string

  // A getter, and defaults read in the constructor rather than installed on the prototype by a
  // static block, keep the class free of top-level side effects. Otherwise any bundle that
  // reaches a module declaring an error class keeps `BaseError` and that module's unused error
  // classes.
  static get defaultStaticOptions() {
    return {
      docsOrigin: 'https://oxlib.sh',
      showVersion: false,
      version: `ox@${getVersion()}`,
    } satisfies BaseError.GlobalOptions
  }

  static setStaticOptions(options: BaseError.GlobalOptions) {
    BaseError.prototype.docsOrigin = options.docsOrigin
    BaseError.prototype.showVersion = options.showVersion
    BaseError.prototype.version = options.version
  }

  constructor(shortMessage: string, options: BaseError.Options<cause> = {}) {
    const details = (() => {
      if (options.cause instanceof BaseError) {
        if (options.cause.details) return options.cause.details
        if (options.cause.shortMessage) return options.cause.shortMessage
      }
      if (
        options.cause &&
        'details' in options.cause &&
        typeof options.cause.details === 'string'
      )
        return options.cause.details
      if (options.cause?.message) return options.cause.message
      return options.details!
    })()
    const docsPath = (() => {
      if (options.cause instanceof BaseError)
        return options.cause.docsPath || options.docsPath
      return options.docsPath
    })()

    const docsBaseUrl =
      options.docsOrigin ?? BaseError.prototype.docsOrigin ?? 'https://oxlib.sh'
    const docs = `${docsBaseUrl}${docsPath ?? ''}`
    const showVersion = Boolean(
      options.version ?? BaseError.prototype.showVersion,
    )
    const version =
      options.version ?? BaseError.prototype.version ?? `ox@${getVersion()}`

    const message = [
      shortMessage || 'An error occurred.',
      ...(options.metaMessages ? ['', ...options.metaMessages] : []),
      ...(details || docsPath || showVersion
        ? [
            '',
            details ? `Details: ${details}` : undefined,
            docsPath ? `See: ${docs}` : undefined,
            showVersion ? `Version: ${version}` : undefined,
          ]
        : []),
    ]
      .filter((x) => typeof x === 'string')
      .join('\n')

    super(message, options.cause ? { cause: options.cause } : undefined)

    // In the order the fields were declared in, and `cause` enumerable, as
    // class fields defined them.
    this.details = details
    this.docs = docs
    this.docsOrigin = docsBaseUrl
    this.docsPath = docsPath
    this.shortMessage = shortMessage
    this.showVersion = showVersion
    this.version = version
    Object.defineProperty(this, 'cause', {
      configurable: true,
      enumerable: true,
      value: options.cause,
      writable: true,
    })
    this.name = 'BaseError'
  }

  walk(): Error
  walk(fn: (err: unknown) => boolean): Error | null
  walk(fn?: any): any {
    return walk(this, fn)
  }
}

export declare namespace BaseError {
  type Options<cause extends Error | undefined = Error | undefined> = {
    /** Cause of the error. */
    cause?: cause | undefined
    /** Details of the error. */
    details?: string | undefined
    /** Origin of the docs. */
    docsOrigin?: string | undefined
    /** Path of the docs. */
    docsPath?: string | undefined
    /** Meta messages to add to the error. */
    metaMessages?: (string | undefined)[] | undefined
    /** Version of the library to attribute the error to. */
    version?: string | undefined
  }

  type GlobalOptions = {
    /** Origin of the docs. */
    docsOrigin?: string | undefined
    /** Whether to show the version of the library in the error message. */
    showVersion?: boolean | undefined
    /** Version of the library to attribute the error to. */
    version?: string | undefined
  }
}

/** @internal */
function walk(
  err: unknown,
  fn?: ((err: unknown) => boolean) | undefined,
): unknown {
  if (fn?.(err)) return err
  if (err && typeof err === 'object' && 'cause' in err && err.cause)
    return walk(err.cause, fn)
  return fn ? null : err
}

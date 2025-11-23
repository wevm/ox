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
  details: string
  docs?: string | undefined
  docsOrigin?: string | undefined
  docsPath?: string | undefined
  shortMessage: string
  showVersion?: boolean | undefined
  version?: string | undefined

  override cause: cause
  override name = 'BaseError'

  static defaultStaticOptions = {
    docsOrigin: 'https://oxlib.sh',
    showVersion: false,
    version: `ox@${getVersion()}`,
  } satisfies BaseError.GlobalOptions

  static setStaticOptions(options: BaseError.GlobalOptions) {
    BaseError.prototype.docsOrigin = options.docsOrigin
    BaseError.prototype.showVersion = options.showVersion
    BaseError.prototype.version = options.version
  }

  static {
    BaseError.setStaticOptions(BaseError.defaultStaticOptions)
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

    const docsBaseUrl = options.docsOrigin ?? BaseError.prototype.docsOrigin
    const docs = `${docsBaseUrl}${docsPath ?? ''}`
    const showVersion = Boolean(
      options.version ?? BaseError.prototype.showVersion,
    )
    const version = options.version ?? BaseError.prototype.version

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

    this.cause = options.cause as any
    this.details = details
    this.docs = docs
    this.docsOrigin = docsBaseUrl
    this.docsPath = docsPath
    this.shortMessage = shortMessage
    this.showVersion = showVersion
    this.version = version
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

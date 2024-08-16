import { getVersion } from './utils.js'

export declare namespace BaseError {
  type Options = {
    cause?: BaseError | Error | undefined
    details?: string | undefined
    docsPath?: string | undefined
    metaMessages?: string[] | undefined
  }
}

/**
 * Base error class inherited by all errors thrown by ox.
 *
 * @example
 * import { Errors } from 'ox'
 * throw new Errors.BaseError('An error occurred')
 */
export class BaseError extends Error {
  details: string
  docs?: string | undefined
  docsPath?: string | undefined
  shortMessage: string

  override name = 'BaseError'

  version = `ox@${getVersion()}`

  constructor(shortMessage: string, options: BaseError.Options = {}) {
    const details = (() => {
      if (options.cause instanceof BaseError) return options.cause.details
      if (options.cause?.message) return options.cause.message
      return options.details!
    })()
    const docsPath = (() => {
      if (options.cause instanceof BaseError)
        return options.cause.docsPath || options.docsPath
      return options.docsPath
    })()

    const docsBaseUrl = 'https://oxlib.sh'
    const docs = `${docsBaseUrl}${docsPath ?? ''}`

    const message = [
      shortMessage || 'An error occurred.',
      ...(options.metaMessages ? ['', ...options.metaMessages] : []),
      docsPath && `\nSee: ${docs}`,
    ]
      .filter((x) => typeof x === 'string')
      .join('\n')

    super(message, options.cause ? { cause: options.cause } : undefined)

    this.details = details
    this.docs = docs
    this.docsPath = docsPath
    this.shortMessage = shortMessage
  }

  walk(): Error
  walk(fn: (err: unknown) => boolean): Error | null
  walk(fn?: any): any {
    return walk(this, fn)
  }
}

function walk(
  err: unknown,
  fn?: ((err: unknown) => boolean) | undefined,
): unknown {
  if (fn?.(err)) return err
  if (err && typeof err === 'object' && 'cause' in err)
    return walk(err.cause, fn)
  return fn ? null : err
}

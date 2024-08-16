import { getVersion } from './utils.js'

type BaseErrorParameters = {
  cause?: BaseError | Error | undefined
  details?: string | undefined
  docsPath?: string | undefined
  metaMessages?: string[] | undefined
}

export type BaseErrorType = BaseError & { name: 'BaseError' }

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

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    const details = (() => {
      if (args.cause instanceof BaseError) return args.cause.details
      if (args.cause?.message) return args.cause.message
      return args.details!
    })()
    const docsPath = (() => {
      if (args.cause instanceof BaseError)
        return args.cause.docsPath || args.docsPath
      return args.docsPath
    })()

    const docsBaseUrl = 'https://oxlib.sh'
    const docs = `${docsBaseUrl}${docsPath ?? ''}`

    const message = [
      shortMessage || 'An error occurred.',
      docsPath && `\nSee: ${docs}`,
    ]
      .filter((x) => typeof x === 'string')
      .join('\n')

    super(message, args.cause ? { cause: args.cause } : undefined)

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

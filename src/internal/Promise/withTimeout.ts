import type { Errors } from '../../Errors.js'
import { Promise_TimeoutError } from './errors.js'

/** @internal */
export function Promise_withTimeout<data>(
  fn: Promise_withTimeout.Fn<data>,
  options: Promise_withTimeout.Options,
): Promise<data> {
  const {
    errorInstance = new Promise_TimeoutError(),
    timeout,
    signal,
  } = options
  return new Promise((resolve, reject) => {
    ;(async () => {
      let timeoutId: any
      try {
        const controller = new AbortController()
        if (timeout > 0)
          timeoutId = setTimeout(() => {
            if (signal) {
              controller.abort()
            } else {
              reject(errorInstance)
            }
          }, timeout) as any
        resolve(await fn({ signal: controller.signal }))
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') reject(errorInstance)
        reject(err)
      } finally {
        clearTimeout(timeoutId)
      }
    })()
  })
}

/** @internal */
export declare namespace Promise_withTimeout {
  type Fn<data> = ({
    signal,
  }: { signal: AbortController['signal'] | null }) => Promise<data>

  type Options = {
    // The error instance to throw when the timeout is reached.
    errorInstance?: Error | undefined
    // The timeout (in ms).
    timeout: number
    // Whether or not the timeout should use an abort signal.
    signal?: boolean | undefined
  }

  type ErrorType = Promise_TimeoutError | Errors.GlobalErrorType
}

/** @internal */
Promise_withTimeout.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Promise_withTimeout.ErrorType

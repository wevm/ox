import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Creates an Ethereum-based BIP-44 HD path.
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const path = HdKey.path({ account: 1, index: 2 })
 * // @log: "m/44'/60'/1'/0/2"
 * ```
 *
 * @param options - Path options.
 * @returns The path.
 */
export function HdKey_path(options: HdKey_path.Options = {}): string {
  const { account = 0, change = 0, index = 0 } = options
  return `m/44'/60'/${account}'/${change}/${index}`
}

export declare namespace HdKey_path {
  interface Options {
    /**
     * The account.
     * @default 0
     */
    account?: number | undefined
    /**
     * The change.
     * @default 0
     */
    change?: number | undefined
    /**
     * The address index.
     * @default 0
     */
    index?: number | undefined
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
HdKey_path.parseError = (error: unknown) => error as HdKey_path.ErrorType

import type * as Address from '../core/Address.js'
import type * as TxEnvelope from '../core/TxEnvelope.js'
import type * as TxEnvelopeEip1559 from '../core/TxEnvelopeEip1559.js'
import type * as TxEnvelopeEip2930 from '../core/TxEnvelopeEip2930.js'
import type * as TxEnvelopeEip4844 from '../core/TxEnvelopeEip4844.js'
import type * as TxEnvelopeEip7702 from '../core/TxEnvelopeEip7702.js'
import type * as TxEnvelopeLegacy from '../core/TxEnvelopeLegacy.js'
import type * as Evm from './Evm.js'

/** A transaction-type pipeline. Omitted stages use the mainnet behavior. */
export type Handler<
  type extends string = string,
  envelope extends object = TxEnvelope.Base<type>,
> = {
  /** Transaction type selected from the envelope. */
  type: type
  /** Executes the transaction frame. */
  execute?: ((host: Host<envelope>) => Evm.Result) | undefined
  /** Prepares transaction-scoped state before execution. */
  prepare?: ((host: Host<envelope>) => void) | undefined
  /** Resolves the transaction sender. */
  sender?: ((envelope: envelope) => Address.Address) | undefined
  /** Settles gas and commits included transaction state. */
  settle?:
    | ((host: Host<envelope>, result: Evm.Result) => Evm.Receipt)
    | undefined
  /** Validates whether the transaction can be included. */
  validate?: ((host: Host<envelope>) => void) | undefined
}

/** Mainnet transaction pipeline host. Custom stages can delegate to defaults. */
export type Host<envelope extends object = TxEnvelope.Base> = {
  /** Configured EVM. */
  evm: Pick<Evm.Evm, 'block' | 'chainId' | 'hardfork' | 'state'>
  /** Transaction envelope. */
  envelope: envelope
  /** Executes the mainnet frame stage. */
  execute(): Evm.Result
  /** Prepares the mainnet transaction state. */
  prepare(): void
  /** Resolved sender. */
  sender: Address.Address
  /** Settles through the mainnet fee pipeline. */
  settle(result: Evm.Result): Evm.Receipt
  /** Runs mainnet inclusion validation. */
  validate(): void
}

/** Extracts the accepted envelope union from transaction handlers. */
export type EnvelopeOf<handlers extends readonly { type: string }[]> =
  EnvelopeOfHandler<handlers[number]>

type EnvelopeOfHandler<handler> =
  handler extends Handler<any, infer envelope> ? envelope : never

/** The five mainnet transaction types. */
export type Mainnet = readonly [
  Handler<'legacy', TxEnvelopeLegacy.TxEnvelopeLegacy>,
  Handler<'eip2930', TxEnvelopeEip2930.TxEnvelopeEip2930>,
  Handler<'eip1559', TxEnvelopeEip1559.TxEnvelopeEip1559>,
  Handler<'eip4844', TxEnvelopeEip4844.TxEnvelopeEip4844>,
  Handler<'eip7702', TxEnvelopeEip7702.TxEnvelopeEip7702>,
]

const mainnetHandlers = [
  { type: 'legacy' },
  { type: 'eip2930' },
  { type: 'eip1559' },
  { type: 'eip4844' },
  { type: 'eip7702' },
] as const satisfies Mainnet

/**
 * Returns the mainnet transaction handlers.
 *
 * @example
 * ```ts twoslash
 * import { Transaction } from 'ox/evm'
 *
 * const handlers = Transaction.mainnet()
 * ```
 */
export function mainnet(): Mainnet {
  return mainnetHandlers
}

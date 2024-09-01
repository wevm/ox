export type {
  TransactionLegacy as Transaction,
  TransactionLegacy_Rpc as Rpc,
  TransactionLegacy_Type as Type,
  TransactionLegacy_TypeRpc as TypeRpc,
} from './internal/transaction/legacy/types.js'

export { TransactionLegacy_fromRpc as fromRpc } from './internal/transaction/legacy/fromRpc.js'

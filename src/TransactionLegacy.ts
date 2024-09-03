export type {
  TransactionLegacy as Transaction,
  TransactionLegacy_Rpc as Rpc,
  TransactionLegacy_Type as Type,
  TransactionLegacy_TypeRpc as TypeRpc,
} from './internal/Transaction/legacy/types.js'

export {
  TransactionLegacy_typeRpc as typeRpc,
  TransactionLegacy_type as type,
} from './internal/Transaction/legacy/constants.js'

export { TransactionLegacy_fromRpc as fromRpc } from './internal/Transaction/legacy/fromRpc.js'

export { TransactionLegacy_toRpc as toRpc } from './internal/Transaction/legacy/toRpc.js'

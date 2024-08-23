export type {
  Authorization,
  AuthorizationList,
  AuthorizationList as List,
  AuthorizationTuple,
  AuthorizationTuple as Tuple,
  AuthorizationTupleList,
  AuthorizationTupleList as TupleList,
} from './internal/types/authorization.js'

export {
  getAuthorizationSignPayload,
  getAuthorizationSignPayload as getSignPayload,
} from './internal/authorization/getAuthorizationSignPayload.js'

export {
  hashAuthorization,
  hashAuthorization as hash,
} from './internal/authorization/hashAuthorization.js'

export {
  toAuthorization,
  toAuthorization as from,
} from './internal/authorization/toAuthorization.js'

export {
  toAuthorizationTuple,
  toAuthorizationTuple as toTuple,
} from './internal/authorization/toAuthorizationTuple.js'

export {
  toAuthorizationTupleList,
  toAuthorizationTupleList as toTupleList,
} from './internal/authorization/toAuthorizationTupleList.js'

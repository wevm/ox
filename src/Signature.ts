export type {
  Signature,
  CompactSignature,
  CompactSignature as Compact,
  LegacySignature,
  LegacySignature as Legacy,
} from './internal/types/signature.js'

export {
  assertSignature,
  assertSignature as assert,
} from './internal/signature/assertSignature.js'

export {
  compactSignatureToSignature,
  compactSignatureToSignature as fromCompact,
} from './internal/signature/compactSignatureToSignature.js'

export {
  deserializeSignature,
  deserializeSignature as deserialize,
} from './internal/signature/deserializeSignature.js'

export {
  serializeSignature,
  serializeSignature as serialize,
} from './internal/signature/serializeSignature.js'

export {
  signatureToCompactSignature,
  signatureToCompactSignature as toCompact,
} from './internal/signature/signatureToCompactSignature.js'

export {
  toSignature,
  toSignature as from,
} from './internal/signature/toSignature.js'

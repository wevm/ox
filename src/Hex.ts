export { concat } from './internal/data/concat.js'

export { isHex } from './internal/data/isHex.js'

export { isBytesEqual as isEqual } from './internal/data/isBytesEqual.js'

export {
  padLeft,
  padRight,
} from './internal/data/pad.js'

export { slice } from './internal/data/slice.js'

export { size } from './internal/data/size.js'

export {
  trimLeft,
  trimRight,
} from './internal/data/trim.js'

export {
  fromHex,
  fromHex as to,
  hexToBigInt,
  hexToBigInt as toBigInt,
  hexToBoolean,
  hexToBoolean as toBoolean,
  hexToNumber,
  hexToNumber as toNumber,
  hexToString,
  hexToString as toString,
} from './internal/hex/fromHex.js'

export {
  hexToBytes,
  hexToBytes as toBytes,
} from './internal/bytes/toBytes.js'

export {
  booleanToHex,
  booleanToHex as fromBoolean,
  bytesToHex,
  bytesToHex as fromBytes,
  numberToHex,
  numberToHex as fromBigInt,
  numberToHex as fromNumber,
  stringToHex,
  stringToHex as fromString,
  toHex,
  toHex as from,
} from './internal/hex/toHex.js'

export type { Hex } from './internal/types/data.js'

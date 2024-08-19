export {
  decodeRlp,
  decodeRlp as decode,
  rlpToBytes,
  rlpToBytes as toBytes,
  rlpToHex,
  rlpToHex as toHex,
} from './internal/rlp/decode.js'

export {
  type RecursiveArray,
  encodeRlp,
  encodeRlp as encode,
  bytesToRlp,
  bytesToRlp as fromBytes,
  hexToRlp,
  hexToRlp as fromHex,
} from './internal/rlp/encode.js'

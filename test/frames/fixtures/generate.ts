import { writeFileSync } from 'node:fs'
import * as Hash from '../../../src/core/Hash.js'
import * as Hex from '../../../src/core/Hex.js'
import * as Rlp from '../../../src/core/Rlp.js'
import * as Secp256k1 from '../../../src/core/Secp256k1.js'
import * as Signature from '../../../src/core/Signature.js'

// Public test key 1; never fund this account outside the isolated test chain.
const privateKey = Hex.fromNumber(1, { size: 32 })
const sender = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
const recipient = '0x0000000000000000000000000000000000001234'
const signatures: Hex.Hex[][] = [['0x01', '0x', '0x', '0x']]
const payload = [
  '0x1fcd',
  '0x',
  sender,
  [
    ['0x01', '0x03', '0x', ['0xc350', '0x'], '0x', '0x'],
    ['0x02', '0x', recipient, ['0xc350', '0x'], '0x01', '0x'],
  ],
  signatures,
  ['0x3b9aca00', '0x77359400', '0x'],
  [],
] as const
const signingHash = Hash.keccak256(Hex.concat('0x06', Rlp.fromHex(payload)))
const signature = Secp256k1.sign({
  payload: signingHash,
  privateKey,
  extraEntropy: false,
})
signatures[0] = [
  '0x01',
  '0x',
  '0x',
  Hex.fromBytes(Signature.toRecoveredBytes(signature)),
]
const serialized = Hex.concat('0x06', Rlp.fromHex(payload))
writeFileSync(
  new URL('./transfer.json', import.meta.url),
  `${JSON.stringify({ sender, recipient, signingHash, serialized, hash: Hash.keccak256(serialized) }, null, 2)}\n`,
)

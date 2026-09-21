import { writeFileSync } from 'node:fs'
import { concat, encodeRlp, keccak256, SigningKey, toBeHex } from 'ethers'

// Public test key 1; never fund this account outside the isolated test chain.
const key = new SigningKey(`0x${'0'.repeat(63)}1`)
const sender = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
const recipient = '0x0000000000000000000000000000000000001234'
const payload = [
  '0x1fcd',
  '0x',
  sender,
  [
    ['0x01', '0x03', '0x', ['0xc350', '0x'], '0x', '0x'],
    ['0x02', '0x', recipient, ['0xc350', '0x'], '0x01', '0x'],
  ],
  [['0x01', '0x', '0x', '0x']],
  ['0x3b9aca00', '0x77359400', '0x'],
  [],
]
const signingHash = keccak256(concat(['0x06', encodeRlp(payload)]))
const signature = key.sign(signingHash)
payload[4] = [
  [
    '0x01',
    '0x',
    '0x',
    concat([toBeHex(signature.yParity, 1), signature.r, signature.s]),
  ],
]
const serialized = concat(['0x06', encodeRlp(payload)])
writeFileSync(
  new URL('./transfer.json', import.meta.url),
  `${JSON.stringify({ sender, recipient, signingHash, serialized, hash: keccak256(serialized) }, null, 2)}\n`,
)

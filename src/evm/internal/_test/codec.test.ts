import { Bytes } from 'ox'
import { describe, expect, test } from 'vp/test'

import * as codec from '../codec.js'

/**
 * Builds an account-info record the way `wasm/evm2/src/state.rs` writes it:
 * a presence flag, then `balance` as a 32-byte big-endian word, `nonce` as a
 * little-endian `u64`, then the 32-byte code hash.
 */
function accountInfo(options: {
  balance: bigint
  codeHash: string
  nonce: bigint
}) {
  const balance = new Uint8Array(32)
  let rest = options.balance
  for (let index = 31; index >= 0; index--) {
    balance[index] = Number(rest & 0xffn)
    rest >>= 8n
  }
  const nonce = new Uint8Array(8)
  let value = options.nonce
  for (let index = 0; index < 8; index++) {
    nonce[index] = Number(value & 0xffn)
    value >>= 8n
  }
  return Bytes.concat(
    Uint8Array.from([1]),
    balance,
    nonce,
    Bytes.fromHex(options.codeHash as `0x${string}`),
  )
}

describe('decodeChanges', () => {
  test('behavior: reads account fields in the order the adapter writes them', () => {
    const address = '0x00000000000000000000000000000000000000c0' as const
    const codeHash = `0x${'ab'.repeat(32)}` as const

    const payload = Bytes.concat(
      Uint8Array.from([codec.record.account]),
      Bytes.fromHex(address),
      // Original absent, so the presence flag stands alone.
      Uint8Array.from([0]),
      accountInfo({ balance: 10n ** 18n, codeHash, nonce: 7n }),
      // created, selfdestructed
      Uint8Array.from([1, 0]),
      Uint8Array.from([codec.record.end]),
    )

    // A field-order slip decodes the nonce into the hash and the hash tail into
    // the nonce, so these three assertions are what pin the two halves together.
    expect(codec.decodeChanges(payload)).toMatchInlineSnapshot(`
      {
        "accountReads": [],
        "accounts": [
          {
            "address": "0x00000000000000000000000000000000000000c0",
            "created": true,
            "current": {
              "balance": 1000000000000000000n,
              "codeHash": "0xabababababababababababababababababababababababababababababababab",
              "nonce": 7n,
            },
            "original": undefined,
            "selfdestructed": false,
          },
        ],
        "bytecode": [],
        "storage": [],
        "storageReads": [],
        "storageWipes": [],
      }
    `)
  })

  test('behavior: an unknown record tag is rejected', () => {
    expect(() => codec.decodeChanges(Uint8Array.from([0x7f])))
      .toThrowErrorMatchingInlineSnapshot(`
      [Evm.DecodeError: The evm2 adapter returned a response this ABI version cannot read.

      unknown change record 127
      Expected ABI version 1.]
    `)
  })
})

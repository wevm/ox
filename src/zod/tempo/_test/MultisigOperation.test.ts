import { describe, expect, test } from 'vp/test'
import * as core_MultisigOperation from '../../../tempo/MultisigOperation.js'
import * as z_MultisigOperation from '../MultisigOperation.js'
import * as z from 'zod/mini'

const rpc = {
  account: '0xf81b7763d3a6876195d780865bd783dbd97dd36e',
  approvals: [
    '0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200',
  ],
  config: {
    owners: [
      {
        owner: '0x07e1ed8ea0e9601e5546b0a03aed683df3601407',
        weight: 1,
      },
      {
        owner: '0x288f0cd85005f34168f731a468aef268c2f9456f',
        weight: 1,
      },
    ],
    salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
    threshold: 2,
  },
  configVersion: '0x1',
  createdAt: 1,
  hash: '0xcdbc24a8fb192f799c5d166b13a99fb29cbb15e71a5e730988d6f8b3c5959d02',
  init: false,
  signatureCount: 1,
  status: 'pending',
  threshold: 2,
  transaction:
    '0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0',
  type: 'transaction',
  updatedAt: 2,
  weight: 1,
} as const

describe('TransactionOperation', () => {
  test('decodes an RPC operation', () => {
    expect(z.decode(z_MultisigOperation.TransactionOperation, rpc)).toEqual(
      core_MultisigOperation.fromRpc(rpc),
    )
  })

  test('round-trips via encode', () => {
    const operation = z.decode(z_MultisigOperation.TransactionOperation, rpc)
    expect(
      z.encode(z_MultisigOperation.TransactionOperation, operation),
    ).toEqual(core_MultisigOperation.toRpc(operation))
  })

  test('rejects internally inconsistent operations', () => {
    expect(
      z.safeDecode(z_MultisigOperation.TransactionOperation, {
        ...rpc,
        weight: 2,
      }).success,
    ).toBe(false)
  })
})

describe('Operation', () => {
  test('accepts transaction operations', () => {
    expect(z.safeDecode(z_MultisigOperation.Operation, rpc).success).toBe(true)
  })
})

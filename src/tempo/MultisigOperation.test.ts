import { Address } from 'ox'
import {
  KeyAuthorization,
  MultisigConfig,
  MultisigOperation,
  SignatureEnvelope,
  TxEnvelopeTempo,
} from 'ox/tempo'
import { describe, expect, test } from 'vitest'

const owner_1 = '0x1111111111111111111111111111111111111111'
const owner_2 = '0x2222222222222222222222222222222222222222'
const config = MultisigConfig.from({
  owners: [
    { owner: owner_1, weight: 1 },
    { owner: owner_2, weight: 1 },
  ],
  threshold: 2,
})
const account = MultisigConfig.getAddress(config)
const ownerSignature_1 = {
  signature: { r: 1n, s: 2n, yParity: 0 },
  type: 'secp256k1',
} as const
const approval_1 = SignatureEnvelope.serialize(ownerSignature_1)
const approval_2 = SignatureEnvelope.serialize({
  signature: { r: 3n, s: 4n, yParity: 1 },
  type: 'secp256k1',
})
const approval_3 = SignatureEnvelope.serialize({
  signature: { r: 5n, s: 6n, yParity: 0 },
  type: 'secp256k1',
})
const transaction = TxEnvelopeTempo.serialize(
  TxEnvelopeTempo.from({
    calls: [{ data: '0x1234', to: owner_1 }],
    chainId: 4217,
  }),
)
const transactionHash = `0x${'aa'.repeat(32)}` as const
const submissionId = `0x${'bb'.repeat(32)}` as const
const keyAuthorization = KeyAuthorization.serialize(
  KeyAuthorization.from({
    account,
    address: '0x3333333333333333333333333333333333333333',
    chainId: 4217n,
    expiry: 1_800_000_000,
    isAdmin: false,
    type: 'secp256k1',
  }),
)

const transactionHash_ = MultisigConfig.getSignPayload({
  account,
  payload: TxEnvelopeTempo.getSignPayload(
    TxEnvelopeTempo.deserialize(transaction),
  ),
  version: 1n,
})
const keyAuthorizationHash = MultisigConfig.getSignPayload({
  account,
  payload: KeyAuthorization.getSignPayload(
    KeyAuthorization.deserialize(keyAuthorization),
  ),
  version: 1n,
})

const base = {
  account,
  approvals: [approval_1],
  config,
  configVersion: 1n,
  createdAt: 1,
  init: false,
  signatureCount: 1,
  threshold: 2,
  updatedAt: 2,
  weight: 1,
} as const

const transactionPending = {
  ...base,
  hash: transactionHash_,
  status: 'pending',
  transaction,
  type: 'transaction',
} as const

const keyAuthorizationPending = {
  ...base,
  hash: keyAuthorizationHash,
  keyAuthorization,
  status: 'pending',
  type: 'keyAuthorization',
} as const

describe('from', () => {
  test('transaction states', () => {
    const pending = MultisigOperation.from(transactionPending)
    const submitting = MultisigOperation.from({
      ...transactionPending,
      approvals: [approval_1, approval_2],
      expiresAt: 10,
      signatureCount: 2,
      status: 'submitting',
      submissionId,
      weight: 2,
    })
    const success = MultisigOperation.from({
      ...transactionPending,
      approvals: [approval_1, approval_2],
      signatureCount: 2,
      status: 'success',
      transactionHash,
      weight: 2,
    })

    expect({ pending, submitting, success }).toMatchInlineSnapshot(`
      {
        "pending": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": 1n,
          "createdAt": 1,
          "hash": "0x4494fb4eefa967db6ab4fc4b303c1b9cc4e4200642da3f0990f2d023beb2c6e9",
          "init": false,
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad994111111111111111111111111111111111111111180821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 1,
        },
        "submitting": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
            "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": 1n,
          "createdAt": 1,
          "expiresAt": 10,
          "hash": "0x4494fb4eefa967db6ab4fc4b303c1b9cc4e4200642da3f0990f2d023beb2c6e9",
          "init": false,
          "signatureCount": 2,
          "status": "submitting",
          "submissionId": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad994111111111111111111111111111111111111111180821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 2,
        },
        "success": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
            "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": 1n,
          "createdAt": 1,
          "hash": "0x4494fb4eefa967db6ab4fc4b303c1b9cc4e4200642da3f0990f2d023beb2c6e9",
          "init": false,
          "signatureCount": 2,
          "status": "success",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad994111111111111111111111111111111111111111180821234c0808080808080c0",
          "transactionHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 2,
        },
      }
    `)
  })

  test('fee-payer transaction', () => {
    const transaction = TxEnvelopeTempo.serialize(
      TxEnvelopeTempo.from({
        calls: [{ data: '0x1234', to: owner_1 }],
        chainId: 4217,
      }),
      { format: 'feePayer', sender: account },
    )
    const operation = MultisigOperation.from({
      ...transactionPending,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
        ),
        version: 1n,
      }),
      transaction,
    })

    expect(operation).toMatchInlineSnapshot(
      {
        hash: expect.any(String),
        transaction: expect.stringMatching(/^0x78/),
      },
      `
      {
        "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
        "approvals": [
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0x2222222222222222222222222222222222222222",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
        },
        "configVersion": 1n,
        "createdAt": 1,
        "hash": Any<String>,
        "init": false,
        "signatureCount": 1,
        "status": "pending",
        "threshold": 2,
        "transaction": StringMatching /\\^0x78/,
        "type": "transaction",
        "updatedAt": 2,
        "weight": 1,
      }
    `,
    )
  })

  test('fee-payer-signed transaction', () => {
    const transaction = TxEnvelopeTempo.serialize(
      TxEnvelopeTempo.from({
        calls: [{ data: '0x1234', to: owner_1 }],
        chainId: 4217,
        feePayerSignature: { r: 5n, s: 6n, yParity: 0 },
      }),
      { format: 'feePayer' },
    )
    const operation = MultisigOperation.from({
      ...transactionPending,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
        ),
        version: 1n,
      }),
      transaction,
    })

    expect(operation.transaction).toBe(transaction)
  })

  test('bootstrap transaction', () => {
    const operation = MultisigOperation.from({
      ...transactionPending,
      configVersion: 0n,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
        ),
        version: 0n,
      }),
      init: true,
    })

    expect(operation).toMatchInlineSnapshot(
      {
        hash: expect.any(String),
        transaction: expect.any(String),
      },
      `
      {
        "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
        "approvals": [
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0x2222222222222222222222222222222222222222",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
        },
        "configVersion": 0n,
        "createdAt": 1,
        "hash": Any<String>,
        "init": true,
        "signatureCount": 1,
        "status": "pending",
        "threshold": 2,
        "transaction": Any<String>,
        "type": "transaction",
        "updatedAt": 2,
        "weight": 1,
      }
    `,
    )
  })

  test('initialized transaction at config version zero', () => {
    const operation = MultisigOperation.from({
      ...transactionPending,
      configVersion: 0n,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
        ),
        version: 0n,
      }),
    })

    expect({
      configVersion: operation.configVersion,
      init: operation.init,
    }).toMatchInlineSnapshot(`
      {
        "configVersion": 0n,
        "init": false,
      }
    `)
  })

  test('key authorization states', () => {
    const pending = MultisigOperation.from(keyAuthorizationPending)
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const success = MultisigOperation.from({
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            signatures: [
              SignatureEnvelope.deserialize(approval_1),
              SignatureEnvelope.deserialize(approval_2),
            ],
            type: 'multisig',
          },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      weight: 2,
    })

    expect({ pending, success }).toMatchInlineSnapshot(`
      {
        "pending": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": 1n,
          "createdAt": 1,
          "hash": "0x274c7ba0c5deab0d531ee0eac2f2b8833b831cf70a63a16aae42d29e8d266bc2",
          "init": false,
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d20080808080949bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "success": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
            "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": 1n,
          "createdAt": 1,
          "hash": "0x274c7ba0c5deab0d531ee0eac2f2b8833b831cf70a63a16aae42d29e8d266bc2",
          "init": false,
          "keyAuthorization": "0xf8daf782107980943333333333333333333333333333333333333333846b49d20080808080949bd9653fca540baad0c9c7e84d90f8e4c4f7b33ab8a005f89d949bd9653fca540baad0c9c7e84d90f8e4c4f7b33af886b841000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021bb841000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
          "signatureCount": 2,
          "status": "success",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 2,
        },
      }
    `)
  })

  test('bootstrap key authorization', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const keyAuthorization_ = KeyAuthorization.serialize(
      KeyAuthorization.from(authorization, {
        signature: {
          account,
          init: config,
          signatures: [
            SignatureEnvelope.deserialize(approval_1),
            SignatureEnvelope.deserialize(approval_2),
          ],
          type: 'multisig',
        },
      }),
    )
    const operation = MultisigOperation.from({
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      configVersion: 0n,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: KeyAuthorization.getSignPayload(authorization),
        version: 0n,
      }),
      init: true,
      keyAuthorization: keyAuthorization_,
      signatureCount: 2,
      status: 'success',
      weight: 2,
    })

    expect(operation).toMatchInlineSnapshot(
      {
        hash: expect.any(String),
        keyAuthorization: expect.any(String),
      },
      `
      {
        "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
        "approvals": [
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x1111111111111111111111111111111111111111",
              "weight": 1,
            },
            {
              "owner": "0x2222222222222222222222222222222222222222",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
        },
        "configVersion": 0n,
        "createdAt": 1,
        "hash": Any<String>,
        "init": true,
        "keyAuthorization": Any<String>,
        "signatureCount": 2,
        "status": "success",
        "threshold": 2,
        "type": "keyAuthorization",
        "updatedAt": 2,
        "weight": 2,
      }
    `,
    )
  })
})

describe('RPC conversion', () => {
  test('round-trips transaction and key authorization operations', () => {
    const transactionRpc = MultisigOperation.toRpc(transactionPending)
    const keyAuthorizationRpc = MultisigOperation.toRpc(keyAuthorizationPending)

    expect({ keyAuthorizationRpc, transactionRpc }).toMatchInlineSnapshot(`
      {
        "keyAuthorizationRpc": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": "0x1",
          "createdAt": 1,
          "hash": "0x274c7ba0c5deab0d531ee0eac2f2b8833b831cf70a63a16aae42d29e8d266bc2",
          "init": false,
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d20080808080949bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "transactionRpc": {
          "account": "0x9bd9653fca540baad0c9c7e84d90f8e4c4f7b33a",
          "approvals": [
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
              {
                "owner": "0x2222222222222222222222222222222222222222",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
          },
          "configVersion": "0x1",
          "createdAt": 1,
          "hash": "0x4494fb4eefa967db6ab4fc4b303c1b9cc4e4200642da3f0990f2d023beb2c6e9",
          "init": false,
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad994111111111111111111111111111111111111111180821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 1,
        },
      }
    `)
    expect(MultisigOperation.fromRpc(transactionRpc)).toStrictEqual(
      MultisigOperation.from(transactionPending),
    )
    expect(MultisigOperation.fromRpc(keyAuthorizationRpc)).toStrictEqual(
      MultisigOperation.from(keyAuthorizationPending),
    )
  })
})

describe('validation', () => {
  test.each([
    {
      name: 'mismatched hash',
      operation: { ...transactionPending, hash: transactionHash },
    },
    {
      name: 'outer transaction signature',
      operation: {
        ...transactionPending,
        transaction: TxEnvelopeTempo.serialize(
          TxEnvelopeTempo.deserialize(transaction),
          { signature: SignatureEnvelope.deserialize(approval_1) },
        ),
      },
    },
    {
      name: 'pending transaction submission fields',
      operation: { ...transactionPending, submissionId },
    },
    {
      name: 'submitting transaction without lease',
      operation: { ...transactionPending, status: 'submitting', weight: 2 },
    },
    {
      name: 'successful transaction without hash',
      operation: { ...transactionPending, status: 'success', weight: 2 },
    },
    {
      name: 'signed pending key authorization',
      operation: {
        ...keyAuthorizationPending,
        keyAuthorization: KeyAuthorization.serialize(
          KeyAuthorization.from(
            KeyAuthorization.deserialize(keyAuthorization),
            {
              signature: ownerSignature_1,
            },
          ),
        ),
      },
    },
    {
      name: 'successful key authorization without quorum',
      operation: { ...keyAuthorizationPending, status: 'success' },
    },
    {
      name: 'pending key authorization with quorum',
      operation: {
        ...keyAuthorizationPending,
        approvals: [approval_1, approval_2],
        signatureCount: 2,
        weight: 2,
      },
    },
    {
      name: 'key authorization with transaction fields',
      operation: { ...keyAuthorizationPending, transaction },
    },
    {
      name: 'transaction with key authorization fields',
      operation: { ...transactionPending, keyAuthorization },
    },
    {
      name: 'selected signature without weight',
      operation: { ...transactionPending, weight: 0 },
    },
    {
      name: 'string config threshold',
      operation: {
        ...transactionPending,
        config: { ...config, threshold: '2' },
      },
    },
    {
      name: 'bigint config owner weight',
      operation: {
        ...transactionPending,
        config: {
          ...config,
          owners: config.owners.map((owner) => ({ ...owner, weight: 1n })),
        },
      },
    },
    {
      name: 'weight unreachable by the selected signature count',
      operation: { ...transactionPending, weight: 2 },
    },
    {
      name: 'zero account',
      operation: {
        ...transactionPending,
        account: '0x0000000000000000000000000000000000000000',
        hash: MultisigConfig.getSignPayload({
          account: '0x0000000000000000000000000000000000000000',
          payload: TxEnvelopeTempo.getSignPayload(
            TxEnvelopeTempo.deserialize(transaction),
          ),
          version: 1n,
        }),
      },
    },
    {
      name: 'non-hex transaction hash',
      operation: {
        ...transactionPending,
        approvals: [approval_1, approval_2],
        signatureCount: 2,
        status: 'success',
        transactionHash: `0x${'gg'.repeat(32)}`,
        weight: 2,
      },
    },
    {
      name: 'non-hex submission ID',
      operation: {
        ...transactionPending,
        approvals: [approval_1, approval_2],
        expiresAt: 10,
        signatureCount: 2,
        status: 'submitting',
        submissionId: `0x${'gg'.repeat(32)}`,
        weight: 2,
      },
    },
    {
      name: 'keychain owner approval',
      operation: {
        ...transactionPending,
        approvals: [
          SignatureEnvelope.serialize({
            inner: ownerSignature_1,
            type: 'keychain',
            userAddress: owner_1,
          }),
        ],
      },
    },
    {
      name: 'nested bootstrap owner approval',
      operation: {
        ...transactionPending,
        approvals: [
          SignatureEnvelope.serialize({
            account,
            init: config,
            signatures: [ownerSignature_1],
            type: 'multisig',
          }),
        ],
      },
    },
    {
      name: 'bootstrap with initialized version',
      operation: { ...transactionPending, init: true },
    },
  ])('rejects $name', ({ operation }) => {
    expect(() =>
      MultisigOperation.from(operation as MultisigOperation.Operation),
    ).toThrowError(MultisigOperation.InvalidOperationError)
  })

  test('rejects noncanonical RPC quantities', () => {
    expect(() =>
      MultisigOperation.fromRpc({
        ...MultisigOperation.toRpc(transactionPending),
        configVersion: '0x01',
      }),
    ).toThrowError(
      'Invalid multisig operation: configVersion must use canonical quantity encoding.',
    )
  })

  test('rejects key authorization signatures absent from retained approvals', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const operation = {
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            signatures: [
              SignatureEnvelope.deserialize(approval_1),
              SignatureEnvelope.deserialize(approval_3),
            ],
            type: 'multisig',
          },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      weight: 2,
    } as const

    expect(() => MultisigOperation.from(operation)).toThrowError(
      'Invalid multisig operation: key authorization signature is not a retained approval.',
    )
  })

  test('rejects unordered key authorization approvals', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const signatures = [
      ...SignatureEnvelope.sortMultisigApprovals({
        account,
        payload: KeyAuthorization.getSignPayload(authorization),
        signatures: [
          SignatureEnvelope.deserialize(approval_1),
          SignatureEnvelope.deserialize(approval_2),
        ],
        version: 1n,
      }),
    ].reverse()
    const operation = {
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: { account, signatures, type: 'multisig' },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      weight: 2,
    } as const

    expect(() => MultisigOperation.from(operation)).toThrowError(
      'Invalid multisig operation: key authorization approvals are not canonically ordered.',
    )
  })

  test('rejects duplicate key authorization approvals', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const operation = {
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_1],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            signatures: [
              SignatureEnvelope.deserialize(approval_1),
              SignatureEnvelope.deserialize(approval_1),
            ],
            type: 'multisig',
          },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      weight: 2,
    } as const

    expect(() => MultisigOperation.from(operation)).toThrowError(
      'Invalid multisig operation: key authorization contains duplicate owner approvals.',
    )
  })

  test('rejects reordered nested key authorization approvals', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const childSignatures = SignatureEnvelope.sortMultisigApprovals({
      account: owner_1,
      payload: keyAuthorizationHash,
      signatures: [
        SignatureEnvelope.deserialize(approval_1),
        SignatureEnvelope.deserialize(approval_2),
      ],
      version: 1n,
    })
    const retainedNested = SignatureEnvelope.from({
      account: owner_1,
      signatures: childSignatures,
      type: 'multisig',
    })
    const selectedNested = SignatureEnvelope.from({
      account: owner_1,
      signatures: [...childSignatures].reverse(),
      type: 'multisig',
    })
    const selected = SignatureEnvelope.sortMultisigApprovals({
      account,
      payload: KeyAuthorization.getSignPayload(authorization),
      signatures: [selectedNested, SignatureEnvelope.deserialize(approval_2)],
      version: 1n,
    })
    const operation = {
      ...keyAuthorizationPending,
      approvals: [SignatureEnvelope.serialize(retainedNested), approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: { account, signatures: selected, type: 'multisig' },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      weight: 2,
    } as const

    expect(() => MultisigOperation.from(operation)).toThrowError(
      'Invalid multisig operation: key authorization signature is not a retained approval.',
    )
  })

  test('accepts case-insensitive bootstrap configs', () => {
    const config = MultisigConfig.from({
      owners: [
        {
          owner: Address.checksum('0x11111111111111111111111111111111111111aa'),
          weight: 1,
        },
        {
          owner: Address.checksum('0x22222222222222222222222222222222222222bb'),
          weight: 1,
        },
      ],
      salt: `0x${'AB'.repeat(32)}`,
      threshold: 2,
    })
    const account = MultisigConfig.getAddress(config)
    const authorization = KeyAuthorization.from({
      account,
      address: '0x3333333333333333333333333333333333333333',
      chainId: 4217n,
      expiry: 1_800_000_000,
      isAdmin: false,
      type: 'secp256k1',
    })
    const signatures = SignatureEnvelope.sortMultisigApprovals({
      account,
      payload: KeyAuthorization.getSignPayload(authorization),
      signatures: [
        SignatureEnvelope.deserialize(approval_1),
        SignatureEnvelope.deserialize(approval_2),
      ],
      version: 0n,
    })
    const approvals = signatures.map((signature) =>
      SignatureEnvelope.serialize(signature),
    )

    const operation = MultisigOperation.from({
      account,
      approvals,
      config,
      configVersion: 0n,
      createdAt: 1,
      hash: MultisigConfig.getSignPayload({
        account,
        payload: KeyAuthorization.getSignPayload(authorization),
        version: 0n,
      }),
      init: true,
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            init: config,
            signatures,
            type: 'multisig',
          },
        }),
      ),
      signatureCount: 2,
      status: 'success',
      threshold: 2,
      type: 'keyAuthorization',
      updatedAt: 2,
      weight: 2,
    })

    expect(operation.config).toStrictEqual(config)
  })
})

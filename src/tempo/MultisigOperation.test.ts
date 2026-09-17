import { factory } from '../../test/tempo/multisig.js'
import { Address, Hash, Hex, P256 } from 'ox'
import {
  KeyAuthorization,
  MultisigConfig,
  MultisigOperation,
  SignatureEnvelope,
  TxEnvelopeTempo,
} from 'ox/tempo'
import { describe, expect, test } from 'vp/test'

const owners = [1n, 2n, 3n]
  .map((value, index) => {
    const privateKey = `0x${value.toString(16).padStart(64, '0')}` as const
    const publicKey = P256.getPublicKey({
      privateKey,
    })
    return {
      address: Address.fromPublicKey(publicKey),
      privateKey,
      publicKey,
      signature: {
        prehash: false,
        publicKey,
        signature: {
          r: `0x${(index * 2 + 1).toString(16).padStart(64, '0')}`,
          s: `0x${(index * 2 + 2).toString(16).padStart(64, '0')}`,
        },
        type: 'p256',
      },
    } as const
  })
  .sort((a, b) => a.address.localeCompare(b.address))
const owner_1 = owners[0]!.address
const owner_2 = owners[1]!.address
const config = MultisigConfig.from({
  owners: [
    { owner: owner_1, weight: 1 },
    { owner: owner_2, weight: 1 },
  ],
  threshold: 2,
})
const currentConfig = MultisigConfig.from({ ...config, version: 1n })
const account = MultisigConfig.getAddress(config, { factory })
const ownerSignature_1 = owners[0]!.signature
const approval_1 = SignatureEnvelope.serialize(ownerSignature_1)
const approval_2 = SignatureEnvelope.serialize(owners[1]!.signature)
const approval_3 = SignatureEnvelope.serialize(owners[2]!.signature)
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
  config: currentConfig,
  payload: TxEnvelopeTempo.getSignPayload(
    TxEnvelopeTempo.deserialize(transaction),
  ),
})
const keyAuthorizationHash = MultisigConfig.getSignPayload({
  account,
  config: currentConfig,
  payload: KeyAuthorization.getSignPayload(
    KeyAuthorization.deserialize(keyAuthorization),
  ),
})

const base = {
  account,
  approvals: [approval_1],
  config: currentConfig,
  createdAt: 1,
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

function signApproval(
  owner: (typeof owners)[number],
  hash: `0x${string}`,
  extraEntropy: false | `0x${string}` = false,
) {
  return SignatureEnvelope.serialize({
    prehash: false,
    publicKey: owner.publicKey,
    signature: P256.sign({
      extraEntropy,
      payload: hash,
      privateKey: owner.privateKey,
    }),
    type: 'p256',
  })
}

function approvalAddresses(
  approvals: readonly `0x${string}`[],
  hash: `0x${string}`,
) {
  return approvals.map((approval) =>
    SignatureEnvelope.extractAddress({
      payload: hash,
      signature: SignatureEnvelope.deserialize(approval),
    }),
  )
}

describe('getHash', () => {
  test('transaction and key authorization', () => {
    expect({
      keyAuthorization: MultisigOperation.getHash({
        account,
        config: currentConfig,
        keyAuthorization,
        type: 'keyAuthorization',
      }),
      transaction: MultisigOperation.getHash({
        account,
        config: currentConfig,
        transaction,
        type: 'transaction',
      }),
    }).toMatchInlineSnapshot(`
      {
        "keyAuthorization": "0xa83016f0e94c4a6125483ffeba3abb0a8df1bc0f5a503f63639e806b793520bb",
        "transaction": "0x2d7e3c7c38a9acf85f0a9d70a39b0e9e5a05d92c7a73b633a47a45be4a112b3b",
      }
    `)
  })
})

describe('selectApprovals', () => {
  test('selects a deterministic weighted quorum', async () => {
    const config = MultisigConfig.from({
      owners: [
        { owner: owners[0]!.address, weight: 2 },
        { owner: owners[1]!.address, weight: 1 },
        { owner: owners[2]!.address, weight: 1 },
      ],
      threshold: 3,
    })
    const account = MultisigConfig.getAddress(config, { factory })
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const approvals = owners.map((owner) => signApproval(owner, hash))
    const alternate = signApproval(owners[0]!, hash, `0x${'01'.repeat(32)}`)
    const selection = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        approvals[2]!,
        approvals[0]!,
        approvals[1]!,
        alternate,
        approvals[0]!,
      ],
      config,
      hash,
    })
    const reversed = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        approvals[0]!,
        alternate,
        approvals[1]!,
        approvals[0]!,
        approvals[2]!,
      ],
      config,
      hash,
    })

    expect(reversed).toStrictEqual(selection)
    expect({
      ...selection,
      approvals: approvalAddresses(selection.approvals, hash),
      selectedApprovals: approvalAddresses(selection.selectedApprovals, hash),
    }).toMatchInlineSnapshot(`
      {
        "approvals": [
          "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
          "0x288f0cd85005f34168f731a468aef268c2f9456f",
          "0xd3a9f047ad43d7e2e4e7e491f1fe2e657a2651b6",
        ],
        "selectedApprovals": [
          "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
          "0x288f0cd85005f34168f731a468aef268c2f9456f",
        ],
        "signatureCount": 2,
        "threshold": 3,
        "weight": 3,
      }
    `)
  })
  test('accepts an explicit account from a chain-configured factory', async () => {
    const selected = await MultisigOperation.selectApprovals({
      account,
      approvals: [],
      config,
      hash: transactionHash_,
    })
    expect(selected.weight).toMatchInlineSnapshot(`0`)
  })
  test('rejects keychain and multisig owner approvals', async () => {
    for (const signature of [
      SignatureEnvelope.from({
        inner: ownerSignature_1,
        type: 'keychain',
        userAddress: account,
        version: 'v2',
      }),
      SignatureEnvelope.from({
        account,
        config,
        signatures: [ownerSignature_1],
      }),
    ])
      await expect(
        MultisigOperation.selectApprovals({
          account,
          approvals: [SignatureEnvelope.serialize(signature)],
          config,
          hash: transactionHash_,
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: only primitive signatures can approve a multisig operation.]`,
      )
  })

  test('rejects invalid and non-owner approvals', async () => {
    const hash = MultisigOperation.getHash({
      account,
      config: currentConfig,
      transaction,
      type: 'transaction',
    })
    const invalid = signApproval(
      owners[0]!,
      `0x${'ff'.repeat(32)}` as `0x${string}`,
    )
    const nonOwner = signApproval(owners[2]!, hash)

    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [invalid],
        config,
        hash,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: signature from owner 0x07e1ed8ea0e9601e5546b0a03aed683df3601407 is invalid.]`,
    )
    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [nonOwner],
        config,
        hash,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: signature is from non-owner 0xd3a9f047ad43d7e2e4e7e491f1fe2e657a2651b6.]`,
    )
  })
})

describe('serializeKeyAuthorization', () => {
  test('current and initial authorizations', async () => {
    const results = []
    for (const applicableConfig of [currentConfig, config]) {
      const hash = MultisigOperation.getHash({
        account,
        config: applicableConfig,
        keyAuthorization,
        type: 'keyAuthorization',
      })
      const selection = await MultisigOperation.selectApprovals({
        account,
        approvals: [
          signApproval(owners[1]!, hash),
          signApproval(owners[0]!, hash),
        ],
        config: applicableConfig,
        hash,
      })
      const serialized = MultisigOperation.serializeKeyAuthorization(
        keyAuthorization,
        {
          account,
          approvals: selection.selectedApprovals,
          config: applicableConfig,
        },
      )
      const value = KeyAuthorization.deserialize(serialized)
      results.push({
        account:
          value.signature?.type === 'multisig'
            ? value.signature.account
            : undefined,
        hash: Hash.keccak256(serialized),
        signatureCount:
          value.signature?.type === 'multisig'
            ? value.signature.signatures.length
            : 0,
        version:
          value.signature?.type === 'multisig'
            ? value.signature.config.version
            : undefined,
      })
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "hash": "0xcd4283709cc1853dc8ed9cc4dd8c3b6a22e1b01f19ad3f6348f4bebe79590408",
          "signatureCount": 2,
          "version": 1n,
        },
        {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "hash": "0x1f66e6adc4ddf8ac9d4575f518be11509ca616ac13d4e0a286b4eef7b96959f2",
          "signatureCount": 2,
          "version": 0n,
        },
      ]
    `)
  })

  test('rejects a signed authorization', async () => {
    const selection = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        signApproval(owners[0]!, keyAuthorizationHash),
        signApproval(owners[1]!, keyAuthorizationHash),
      ],
      config: currentConfig,
      hash: keyAuthorizationHash,
    })
    const signed = MultisigOperation.serializeKeyAuthorization(
      keyAuthorization,
      {
        account,
        approvals: selection.selectedApprovals,
        config: currentConfig,
      },
    )

    expect(() =>
      MultisigOperation.serializeKeyAuthorization(signed, {
        account,
        approvals: selection.selectedApprovals,
        config: currentConfig,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidOperationError: Invalid multisig operation: keyAuthorization must not contain a signature.]`,
    )
  })
})

describe('serializeTransaction', () => {
  test('current and initial transactions', async () => {
    const results = []
    for (const applicableConfig of [currentConfig, config]) {
      const hash = MultisigOperation.getHash({
        account,
        config: applicableConfig,
        transaction,
        type: 'transaction',
      })
      const selection = await MultisigOperation.selectApprovals({
        account,
        approvals: [
          signApproval(owners[1]!, hash),
          signApproval(owners[0]!, hash),
        ],
        config: applicableConfig,
        hash,
      })
      const operation = MultisigOperation.from({
        account,
        approvals: selection.approvals,
        config: applicableConfig,
        createdAt: 1,
        hash,
        signatureCount: selection.signatureCount,
        status: 'pending',
        threshold: selection.threshold,
        transaction,
        type: 'transaction',
        updatedAt: 1,
        weight: selection.weight,
      })
      const serialized = MultisigOperation.serializeTransaction(operation, {
        approvals: selection.selectedApprovals,
      })
      const value = TxEnvelopeTempo.deserialize(serialized)
      results.push({
        account: value.signature?.account,
        version:
          value.signature?.type === 'multisig'
            ? value.signature.config.version
            : undefined,
        hash: Hash.keccak256(serialized),
        signatureCount:
          value.signature?.type === 'multisig'
            ? value.signature.signatures.length
            : 0,
        type: serialized.slice(0, 4),
      })
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "hash": "0x6a034f208339f7eaa4a42b3fa03aad5df77ebe83659dac2e4d2b11226d221928",
          "signatureCount": 2,
          "type": "0x76",
          "version": 1n,
        },
        {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "hash": "0x04d36e54d7a816b080dfa03370da6fbeb3523ce3eff5211d7f22a3c7e87476ee",
          "signatureCount": 2,
          "type": "0x76",
          "version": 0n,
        },
      ]
    `)
  })

  test('fee-payer transactions', async () => {
    const envelope = TxEnvelopeTempo.from({
      calls: [{ data: '0x1234', to: owner_1 }],
      chainId: 4217,
    })
    const transactions = [
      TxEnvelopeTempo.serialize(envelope, {
        format: 'feePayer',
        sender: account,
      }),
      TxEnvelopeTempo.serialize(
        {
          ...envelope,
          feePayerSignature: {
            r: `0x${'05'.padStart(64, '0')}`,
            s: `0x${'06'.padStart(64, '0')}`,
            yParity: 0,
          },
        },
        { format: 'feePayer' },
      ),
    ] as const
    const results = []
    for (const transaction of transactions) {
      const hash = MultisigOperation.getHash({
        account,
        config: currentConfig,
        transaction,
        type: 'transaction',
      })
      const selection = await MultisigOperation.selectApprovals({
        account,
        approvals: [
          signApproval(owners[0]!, hash),
          signApproval(owners[1]!, hash),
        ],
        config: currentConfig,
        hash,
      })
      const serialized = MultisigOperation.serializeTransaction(
        MultisigOperation.from({
          account,
          approvals: selection.approvals,
          config: currentConfig,
          createdAt: 1,
          hash,
          signatureCount: selection.signatureCount,
          status: 'pending',
          threshold: selection.threshold,
          transaction,
          type: 'transaction',
          updatedAt: 1,
          weight: selection.weight,
        }),
        { approvals: selection.selectedApprovals },
      )
      const value = TxEnvelopeTempo.deserialize(serialized)
      results.push({
        feePayerSignature: value.feePayerSignature,
        from: value.from,
        signatureCount:
          value.signature?.type === 'multisig'
            ? value.signature.signatures.length
            : 0,
        type: serialized.slice(0, 4),
      })
    }

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "feePayerSignature": null,
          "from": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "signatureCount": 2,
          "type": "0x78",
        },
        {
          "feePayerSignature": {
            "r": "0x0000000000000000000000000000000000000000000000000000000000000005",
            "s": "0x0000000000000000000000000000000000000000000000000000000000000006",
            "yParity": 0,
          },
          "from": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "signatureCount": 2,
          "type": "0x78",
        },
      ]
    `)
  })

  test('rejects an approval not retained by the operation', async () => {
    const hash = MultisigOperation.getHash({
      account,
      config: currentConfig,
      transaction,
      type: 'transaction',
    })
    const approval_1 = signApproval(owners[0]!, hash)
    const approval_2 = signApproval(owners[1]!, hash)
    const selection = await MultisigOperation.selectApprovals({
      account,
      approvals: [approval_1],
      config: currentConfig,
      hash,
    })
    const operation = MultisigOperation.from({
      account,
      approvals: selection.approvals,
      config: currentConfig,
      createdAt: 1,
      hash,
      signatureCount: selection.signatureCount,
      status: 'pending',
      threshold: selection.threshold,
      transaction,
      type: 'transaction',
      updatedAt: 1,
      weight: selection.weight,
    })

    expect(() =>
      MultisigOperation.serializeTransaction(operation, {
        approvals: [approval_2],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidOperationError: Invalid multisig operation: transaction signature is not a retained approval.]`,
    )
  })
})

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
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": 1n,
          },
          "createdAt": 1,
          "hash": "0x2d7e3c7c38a9acf85f0a9d70a39b0e9e5a05d92c7a73b633a47a45be4a112b3b",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 1,
        },
        "submitting": {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
            "0x01000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": 1n,
          },
          "createdAt": 1,
          "expiresAt": 10,
          "hash": "0x2d7e3c7c38a9acf85f0a9d70a39b0e9e5a05d92c7a73b633a47a45be4a112b3b",
          "signatureCount": 2,
          "status": "submitting",
          "submissionId": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 2,
        },
        "success": {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
            "0x01000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": 1n,
          },
          "createdAt": 1,
          "hash": "0x2d7e3c7c38a9acf85f0a9d70a39b0e9e5a05d92c7a73b633a47a45be4a112b3b",
          "signatureCount": 2,
          "status": "success",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0",
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
        config: currentConfig,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(
            Hex.concat(
              TxEnvelopeTempo.serializedType,
              Hex.slice(transaction, 1),
            ) as TxEnvelopeTempo.Serialized,
          ),
        ),
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
        "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
        "approvals": [
          "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
              "weight": 1,
            },
            {
              "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
          "version": 1n,
        },
        "createdAt": 1,
        "hash": Any<String>,
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
        feePayerSignature: {
          r: `0x${'05'.padStart(64, '0')}`,
          s: `0x${'06'.padStart(64, '0')}`,
          yParity: 0,
        },
      }),
      { format: 'feePayer' },
    )
    const operation = MultisigOperation.from({
      ...transactionPending,
      hash: MultisigConfig.getSignPayload({
        account,
        config: currentConfig,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(
            Hex.concat(
              TxEnvelopeTempo.serializedType,
              Hex.slice(transaction, 1),
            ) as TxEnvelopeTempo.Serialized,
          ),
        ),
      }),
      transaction,
    })

    expect(operation.transaction).toBe(transaction)
  })

  test('initial transaction', () => {
    const operation = MultisigOperation.from({
      ...transactionPending,
      config,
      hash: MultisigConfig.getSignPayload({
        account,
        config,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
        ),
      }),
    })

    expect(operation).toMatchInlineSnapshot(
      {
        hash: expect.any(String),
        transaction: expect.any(String),
      },
      `
      {
        "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
        "approvals": [
          "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
              "weight": 1,
            },
            {
              "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
          "version": 0n,
        },
        "createdAt": 1,
        "hash": Any<String>,
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
            config: currentConfig,
            signatures: [ownerSignature_1, owners[1]!.signature],
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
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": 1n,
          },
          "createdAt": 1,
          "hash": "0xa83016f0e94c4a6125483ffeba3abb0a8df1bc0f5a503f63639e806b793520bb",
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d2008080808094ef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "success": {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
            "0x01000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": 1n,
          },
          "createdAt": 1,
          "hash": "0xa83016f0e94c4a6125483ffeba3abb0a8df1bc0f5a503f63639e806b793520bb",
          "keyAuthorization": "0xf901b3f782107980943333333333333333333333333333333333333333846b49d2008080808094ef6b17836e1b3647105c3084124485e3e1b0ab7fb9017805f9017494ef6b17836e1b3647105c3084124485e3e1b0ab7ff852a000000000000000000000000000000000000000000000000000000000000000000102eed69407e1ed8ea0e9601e5546b0a03aed683df360140701d694288f0cd85005f34168f731a468aef268c2f9456f01f90108b88201000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200b88201000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
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

  test('initial key authorization', () => {
    const authorization = KeyAuthorization.deserialize(keyAuthorization)
    const keyAuthorization_ = KeyAuthorization.serialize(
      KeyAuthorization.from(authorization, {
        signature: {
          account,
          config,
          signatures: [ownerSignature_1, owners[1]!.signature],
          type: 'multisig',
        },
      }),
    )
    const operation = MultisigOperation.from({
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      config,
      hash: MultisigConfig.getSignPayload({
        account,
        config,
        payload: KeyAuthorization.getSignPayload(authorization),
      }),
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
        "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
        "approvals": [
          "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
          "0x01000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
        ],
        "config": {
          "owners": [
            {
              "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
              "weight": 1,
            },
            {
              "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 2,
          "version": 0n,
        },
        "createdAt": 1,
        "hash": Any<String>,
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

    expect(() =>
      JSON.stringify({ keyAuthorizationRpc, transactionRpc }),
    ).not.toThrow()
    expect({ keyAuthorizationRpc, transactionRpc }).toMatchInlineSnapshot(`
      {
        "keyAuthorizationRpc": {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": "0x1",
          },
          "createdAt": 1,
          "hash": "0xa83016f0e94c4a6125483ffeba3abb0a8df1bc0f5a503f63639e806b793520bb",
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d2008080808094ef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "transactionRpc": {
          "account": "0xef6b17836e1b3647105c3084124485e3e1b0ab7f",
          "approvals": [
            "0x01000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200",
          ],
          "config": {
            "owners": [
              {
                "owner": "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
                "weight": 1,
              },
              {
                "owner": "0x288f0cd85005f34168f731a468aef268c2f9456f",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 2,
            "version": "0x1",
          },
          "createdAt": 1,
          "hash": "0x2d7e3c7c38a9acf85f0a9d70a39b0e9e5a05d92c7a73b633a47a45be4a112b3b",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0",
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
          { signature: ownerSignature_1 },
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
      name: 'weight unreachable by the retained owner approvals',
      operation: {
        ...transactionPending,
        config: MultisigConfig.from({
          owners: [
            { owner: owner_1, weight: 1 },
            { owner: owner_2, weight: 2 },
          ],
          threshold: 2,
        }),
        weight: 2,
      },
    },
    {
      name: 'non-owner approval',
      operation: { ...transactionPending, approvals: [approval_3] },
    },
    {
      name: 'zero account',
      operation: {
        ...transactionPending,
        account: '0x0000000000000000000000000000000000000000',
        hash: MultisigConfig.getSignPayload({
          account: '0x0000000000000000000000000000000000000000',
          config: currentConfig,
          payload: TxEnvelopeTempo.getSignPayload(
            TxEnvelopeTempo.deserialize(transaction),
          ),
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
      name: 'odd-length transaction hash',
      operation: {
        ...transactionPending,
        approvals: [approval_1, approval_2],
        signatureCount: 2,
        status: 'success',
        transactionHash: `0x${'a'.repeat(63)}`,
        weight: 2,
      },
    },
    {
      name: 'odd-length submission ID',
      operation: {
        ...transactionPending,
        approvals: [approval_1, approval_2],
        expiresAt: 10,
        signatureCount: 2,
        status: 'submitting',
        submissionId: `0x${'b'.repeat(63)}`,
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
      name: 'nested non-owner approval',
      operation: {
        ...transactionPending,
        approvals: [
          SignatureEnvelope.serialize({
            account,
            config,
            signatures: [ownerSignature_1],
            type: 'multisig',
          }),
        ],
      },
    },
  ])('rejects $name', ({ operation }) => {
    expect(() =>
      MultisigOperation.from(operation as MultisigOperation.Operation),
    ).toThrowError(MultisigOperation.InvalidOperationError)
  })
  test('accepts initial accounts validated by the chain', () => {
    const value = MultisigOperation.from({
      ...transactionPending,
      config,
      hash: MultisigOperation.getHash({
        account,
        config,
        transaction,
        type: 'transaction',
      }),
    })
    expect(value.account).toBe(account)
    expect(value.config).toEqual(config)
  })

  test('rejects noncanonical RPC quantities', () => {
    const operation = MultisigOperation.toRpc(transactionPending)
    expect(() =>
      MultisigOperation.fromRpc({
        ...operation,
        config: { ...operation.config, version: '0x01' },
      }),
    ).toThrowError(
      'Invalid multisig operation: config.version must use canonical quantity encoding.',
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
            config: currentConfig,
            signatures: [ownerSignature_1, owners[2]!.signature],
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
        config: currentConfig,
        payload: KeyAuthorization.getSignPayload(authorization),
        signatures: [ownerSignature_1, owners[1]!.signature],
      }),
    ].reverse()
    const operation = {
      ...keyAuthorizationPending,
      approvals: [approval_1, approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            config: currentConfig,
            signatures,
            type: 'multisig',
          },
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
            config: currentConfig,
            signatures: [ownerSignature_1, ownerSignature_1],
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

  test('accepts case-insensitive initial configs', () => {
    const config = MultisigConfig.from({
      owners: [
        {
          owner: Address.checksum(owner_1),
          weight: 1,
        },
        {
          owner: Address.checksum(owner_2),
          weight: 1,
        },
      ],
      salt: `0x${'AB'.repeat(32)}`,
      threshold: 2,
    })
    const account = MultisigConfig.getAddress(config, { factory })
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
      config,
      payload: KeyAuthorization.getSignPayload(authorization),
      signatures: [ownerSignature_1, owners[1]!.signature],
    })
    const approvals = signatures.map((signature) =>
      SignatureEnvelope.serialize(signature),
    )

    const operation = MultisigOperation.from({
      account,
      approvals,
      config,
      createdAt: 1,
      hash: MultisigConfig.getSignPayload({
        account,
        config,
        payload: KeyAuthorization.getSignPayload(authorization),
      }),
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            config,
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

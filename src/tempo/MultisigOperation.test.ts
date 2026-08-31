import { Address, Hash, P256 } from 'ox'
import {
  KeyAuthorization,
  MultisigConfig,
  MultisigOperation,
  SignatureEnvelope,
  TxEnvelopeTempo,
} from 'ox/tempo'
import { describe, expect, test } from 'vitest'

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
        signature: { r: BigInt(index * 2 + 1), s: BigInt(index * 2 + 2) },
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
const account = MultisigConfig.getAddress(config)
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
        "keyAuthorization": "0xd903cd2c94f6a1526a6f79da6f87087c10b26e06d4d4bc1624ce4498961a3b04",
        "transaction": "0xc93c1dc27cc9fb7616d61f97962e4fab8b39af0d1dace8f8b8730cb6922bd096",
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
    const account = MultisigConfig.getAddress(config)
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

  test('counts a nested owner only after its quorum', async () => {
    const childConfig = MultisigConfig.from({
      owners: [
        { owner: owners[1]!.address, weight: 1 },
        { owner: owners[2]!.address, weight: 1 },
      ],
      threshold: 2,
    })
    const child = MultisigConfig.getAddress(childConfig)
    const config = MultisigConfig.from({
      owners: [
        { owner: owners[0]!.address, weight: 1 },
        { owner: child, weight: 2 },
      ],
      threshold: 2,
    })
    const account = MultisigConfig.getAddress(config)
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const childHash = MultisigConfig.getSignPayload({
      account: child,
      config: { ...childConfig, version: 2n },
      payload: hash,
    })
    const childApprovals = [
      signApproval(owners[1]!, childHash),
      signApproval(owners[2]!, childHash),
    ]
    const rootApproval = signApproval(owners[0]!, hash)
    const partial = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        rootApproval,
        SignatureEnvelope.serialize({
          account: child,
          config: MultisigConfig.from({ ...childConfig, version: 2n }),
          signatures: [SignatureEnvelope.deserialize(childApprovals[0]!)],
          type: 'multisig',
        }),
      ],
      config,
      hash,
    })
    const complete = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        rootApproval,
        SignatureEnvelope.serialize({
          account: child,
          config: MultisigConfig.from({ ...childConfig, version: 2n }),
          signatures: childApprovals.map((approval) =>
            SignatureEnvelope.deserialize(approval),
          ),
          type: 'multisig',
        }),
      ],
      config,
      hash,
    })

    expect({
      complete: {
        ...complete,
        approvals: approvalAddresses(complete.approvals, hash),
        selectedApprovals: approvalAddresses(complete.selectedApprovals, hash),
      },
      partial: {
        ...partial,
        approvals: approvalAddresses(partial.approvals, hash),
        selectedApprovals: approvalAddresses(partial.selectedApprovals, hash),
      },
    }).toMatchInlineSnapshot(`
      {
        "complete": {
          "approvals": [
            "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
            "0xf75618474e5f7fd9ef17dd85167a5b1e1f19b84b",
          ],
          "selectedApprovals": [
            "0xf75618474e5f7fd9ef17dd85167a5b1e1f19b84b",
          ],
          "signatureCount": 1,
          "threshold": 2,
          "weight": 2,
        },
        "partial": {
          "approvals": [
            "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
            "0xf75618474e5f7fd9ef17dd85167a5b1e1f19b84b",
          ],
          "selectedApprovals": [
            "0x07e1ed8ea0e9601e5546b0a03aed683df3601407",
          ],
          "signatureCount": 1,
          "threshold": 2,
          "weight": 1,
        },
      }
    `)
  })

  test('rejects conflicting nested config witnesses', async () => {
    const childConfig = MultisigConfig.from({
      owners: [{ owner: owners[1]!.address, weight: 1 }],
      threshold: 1,
    })
    const child = MultisigConfig.getAddress(childConfig)
    const config = MultisigConfig.from({
      owners: [{ owner: child, weight: 1 }],
      threshold: 1,
    })
    const account = MultisigConfig.getAddress(config)
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const config_2 = MultisigConfig.from({
      ...childConfig,
      version: 2n,
    })
    const config_3 = MultisigConfig.from({
      ...childConfig,
      version: 3n,
    })
    const childHash_2 = MultisigConfig.getSignPayload({
      account: child,
      config: config_2,
      payload: hash,
    })
    const childHash_3 = MultisigConfig.getSignPayload({
      account: child,
      config: config_3,
      payload: hash,
    })

    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [
          SignatureEnvelope.serialize({
            account: child,
            config: config_2,
            signatures: [
              SignatureEnvelope.deserialize(
                signApproval(owners[1]!, childHash_2),
              ),
            ],
            type: 'multisig',
          }),
          SignatureEnvelope.serialize({
            account: child,
            config: config_3,
            signatures: [
              SignatureEnvelope.deserialize(
                signApproval(owners[1]!, childHash_3),
              ),
            ],
            type: 'multisig',
          }),
        ],
        config,
        hash,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: nested multisig owner 0x5b7c564e95bde16197e73f9eaa9c7413f11f49ad has conflicting config witnesses.]`,
    )
  })

  test('rejects an initial root config for another account', async () => {
    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [],
        config: MultisigConfig.from({
          ...config,
          salt: `0x${'ff'.repeat(32)}`,
        }),
        hash: transactionHash_,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: initial config does not derive the root multisig account.]`,
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

  test('reads current nested config witnesses from approvals', async () => {
    const childConfig = MultisigConfig.from({
      owners: [{ owner: owners[1]!.address, weight: 1 }],
      threshold: 1,
    })
    const child = MultisigConfig.getAddress(childConfig)
    const config = MultisigConfig.from({
      owners: [{ owner: child, weight: 1 }],
      threshold: 1,
    })
    const account = MultisigConfig.getAddress(config)
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const childHash = MultisigConfig.getSignPayload({
      account: child,
      config: { ...childConfig, version: 1n },
      payload: hash,
    })

    const selection = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        SignatureEnvelope.serialize({
          account: child,
          config: MultisigConfig.from({ ...childConfig, version: 1n }),
          signatures: [
            SignatureEnvelope.deserialize(signApproval(owners[1]!, childHash)),
          ],
          type: 'multisig',
        }),
      ],
      config,
      hash,
    })
    expect(selection).toMatchInlineSnapshot(
      {
        approvals: [expect.any(String)],
        selectedApprovals: [expect.any(String)],
      },
      `
      {
        "approvals": [
          Any<String>,
        ],
        "selectedApprovals": [
          Any<String>,
        ],
        "signatureCount": 1,
        "threshold": 1,
        "weight": 1,
      }
    `,
    )
  })

  test('rejects keychain and accepts initial nested approvals', async () => {
    const childConfig = MultisigConfig.from({
      owners: [{ owner: owners[1]!.address, weight: 1 }],
      threshold: 1,
    })
    const child = MultisigConfig.getAddress(childConfig)
    const config = MultisigConfig.from({
      owners: [
        { owner: owners[0]!.address, weight: 1 },
        { owner: child, weight: 1 },
      ],
      threshold: 1,
    })
    const account = MultisigConfig.getAddress(config)
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const childHash = MultisigConfig.getSignPayload({
      account: child,
      config: childConfig,
      payload: hash,
    })

    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [
          SignatureEnvelope.serialize({
            inner: SignatureEnvelope.deserialize(
              signApproval(owners[0]!, hash),
            ),
            type: 'keychain',
            userAddress: owners[0]!.address,
          }),
        ],
        config,
        hash,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: keychain signatures cannot approve a multisig operation.]`,
    )
    const selection = await MultisigOperation.selectApprovals({
      account,
      approvals: [
        SignatureEnvelope.serialize({
          account: child,
          config: childConfig,
          signatures: [
            SignatureEnvelope.deserialize(signApproval(owners[1]!, childHash)),
          ],
          type: 'multisig',
        }),
      ],
      config,
      hash,
    })
    expect({
      signatureCount: selection.signatureCount,
      threshold: selection.threshold,
      weight: selection.weight,
    }).toMatchInlineSnapshot(`
      {
        "signatureCount": 1,
        "threshold": 1,
        "weight": 1,
      }
    `)
  })

  test('rejects nested account cycles while serializing', () => {
    const config = MultisigConfig.from({
      owners: [{ owner: account, weight: 1 }],
      threshold: 1,
    })
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 2n },
      transaction,
      type: 'transaction',
    })
    const nestedHash = MultisigConfig.getSignPayload({
      account,
      config: { version: 2n },
      payload: hash,
    })

    expect(() =>
      SignatureEnvelope.serialize({
        account,
        config: MultisigConfig.from({ ...config, version: 2n }),
        signatures: [
          SignatureEnvelope.deserialize(signApproval(owners[0]!, nestedHash)),
        ],
        type: 'multisig',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig account cannot be an owner.]`,
    )
  })

  test('rejects excess nesting depth', async () => {
    const grandchildConfig = MultisigConfig.from({
      owners: [{ owner: owners[2]!.address, weight: 1 }],
      threshold: 1,
    })
    const grandchild = MultisigConfig.getAddress(grandchildConfig)
    const childConfig = MultisigConfig.from({
      owners: [{ owner: grandchild, weight: 1 }],
      threshold: 1,
    })
    const child = MultisigConfig.getAddress(childConfig)
    const config = MultisigConfig.from({
      owners: [{ owner: child, weight: 1 }],
      threshold: 1,
    })
    const account = MultisigConfig.getAddress(config)
    const hash = MultisigOperation.getHash({
      account,
      config: { ...config, version: 1n },
      transaction,
      type: 'transaction',
    })
    const childHash = MultisigConfig.getSignPayload({
      account: child,
      config: { ...childConfig, version: 1n },
      payload: hash,
    })
    const grandchildHash = MultisigConfig.getSignPayload({
      account: grandchild,
      config: { ...grandchildConfig, version: 1n },
      payload: childHash,
    })

    await expect(
      MultisigOperation.selectApprovals({
        account,
        approvals: [
          SignatureEnvelope.serialize({
            account: child,
            config: MultisigConfig.from({ ...childConfig, version: 1n }),
            signatures: [
              {
                account: grandchild,
                config: MultisigConfig.from({
                  ...grandchildConfig,
                  version: 1n,
                }),
                signatures: [
                  SignatureEnvelope.deserialize(
                    signApproval(owners[2]!, grandchildHash),
                  ),
                ],
                type: 'multisig',
              },
            ],
            type: 'multisig',
          }),
        ],
        config,
        hash,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[MultisigOperation.InvalidApprovalError: Invalid multisig approval: nested multisig owner 0x4e51c0503aab130b1a358e8eab4c6302618fb3a6 is invalid.]`,
    )
  })
})

describe('serializeKeyAuthorization', () => {
  test('behavior: current and initial authorizations', async () => {
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "hash": "0x52562f8b8042498f83189316f0aacda4d5b80468f0001300829c4d353db5f101",
          "signatureCount": 2,
          "version": 1n,
        },
        {
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "hash": "0x948de4ae52c7cd35151c2ddcd31c97ea89662e83bd18a3cbc323894a1fd8ca06",
          "signatureCount": 2,
          "version": 0n,
        },
      ]
    `)
  })

  test('error: signed authorization', async () => {
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "hash": "0x2d4748a76d91da5fd3d762cb0f925de32347fdbd89d23356d481b526e3d3ab10",
          "signatureCount": 2,
          "type": "0x76",
          "version": 1n,
        },
        {
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "hash": "0x2bf7e539779104921d32758dc184ece6aa8872bfb3b86e2f4d8e0ba1d85ee821",
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
          feePayerSignature: { r: 5n, s: 6n, yParity: 0 },
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
          "from": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "signatureCount": 2,
          "type": "0x78",
        },
        {
          "feePayerSignature": {
            "r": 5n,
            "s": 6n,
            "yParity": 0,
          },
          "from": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xc93c1dc27cc9fb7616d61f97962e4fab8b39af0d1dace8f8b8730cb6922bd096",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "transaction": "0x76e9821079808080dad99407e1ed8ea0e9601e5546b0a03aed683df360140780821234c0808080808080c0",
          "type": "transaction",
          "updatedAt": 2,
          "weight": 1,
        },
        "submitting": {
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xc93c1dc27cc9fb7616d61f97962e4fab8b39af0d1dace8f8b8730cb6922bd096",
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xc93c1dc27cc9fb7616d61f97962e4fab8b39af0d1dace8f8b8730cb6922bd096",
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
          TxEnvelopeTempo.deserialize(transaction),
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
        "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
        feePayerSignature: { r: 5n, s: 6n, yParity: 0 },
      }),
      { format: 'feePayer' },
    )
    const operation = MultisigOperation.from({
      ...transactionPending,
      hash: MultisigConfig.getSignPayload({
        account,
        config: currentConfig,
        payload: TxEnvelopeTempo.getSignPayload(
          TxEnvelopeTempo.deserialize(transaction),
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
        "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xd903cd2c94f6a1526a6f79da6f87087c10b26e06d4d4bc1624ce4498961a3b04",
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d200808080809417e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "success": {
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xd903cd2c94f6a1526a6f79da6f87087c10b26e06d4d4bc1624ce4498961a3b04",
          "keyAuthorization": "0xf901b3f782107980943333333333333333333333333333333333333333846b49d200808080809417e90f73f4c7c75dc01b00b262e7b95ed3086bd0b9017805f901749417e90f73f4c7c75dc01b00b262e7b95ed3086bd0f852a000000000000000000000000000000000000000000000000000000000000000000102eed69407e1ed8ea0e9601e5546b0a03aed683df360140701d694288f0cd85005f34168f731a468aef268c2f9456f01f90108b88201000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000065ecbe4d1a6330a44c8f7ef951d4bf165e6c6b721efada985fb41661bc6e7fd6c8734640c4998ff7e374b06ce1a64a2ecd82ab036384fb83d9a79b127a27d503200b88201000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000047cf27b188d034f7e8a52380304b51ac3c08969e277f21b35a60b48fc4766997807775510db8ed040293d9ac69f7430dbba7dade63ce982299e04b79d227873d100",
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
        "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xd903cd2c94f6a1526a6f79da6f87087c10b26e06d4d4bc1624ce4498961a3b04",
          "keyAuthorization": "0xf838f782107980943333333333333333333333333333333333333333846b49d200808080809417e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
          "signatureCount": 1,
          "status": "pending",
          "threshold": 2,
          "type": "keyAuthorization",
          "updatedAt": 2,
          "weight": 1,
        },
        "transactionRpc": {
          "account": "0x17e90f73f4c7c75dc01b00b262e7b95ed3086bd0",
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
          "hash": "0xc93c1dc27cc9fb7616d61f97962e4fab8b39af0d1dace8f8b8730cb6922bd096",
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

  test('rejects an initial config for another account', () => {
    const config = MultisigConfig.from({
      ...transactionPending.config,
      salt: `0x${'ff'.repeat(32)}`,
      version: 0n,
    })
    expect(() =>
      MultisigOperation.from({
        ...transactionPending,
        config,
        hash: MultisigConfig.getSignPayload({
          account,
          config,
          payload: TxEnvelopeTempo.getSignPayload(
            TxEnvelopeTempo.deserialize(transaction),
          ),
        }),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [MultisigOperation.InvalidOperationError: Invalid multisig operation.

      Details: Invalid native multisig owner approval: initial multisig config does not derive account.]
    `,
    )
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
        config: currentConfig,
        payload: KeyAuthorization.getSignPayload(authorization),
        signatures: [
          SignatureEnvelope.deserialize(approval_1),
          SignatureEnvelope.deserialize(approval_2),
        ],
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
    const nestedConfig = MultisigConfig.from({
      owners: [{ owner: owner_2, weight: 1 }],
      threshold: 1,
      version: 1n,
    })
    const childSignatures = SignatureEnvelope.sortMultisigApprovals({
      account: owner_1,
      config: nestedConfig,
      payload: keyAuthorizationHash,
      signatures: [
        SignatureEnvelope.deserialize(approval_1),
        SignatureEnvelope.deserialize(approval_2),
      ],
    })
    const retainedNested = SignatureEnvelope.from({
      account: owner_1,
      config: nestedConfig,
      signatures: childSignatures,
      type: 'multisig',
    })
    const selectedNested = SignatureEnvelope.from({
      account: owner_1,
      config: nestedConfig,
      signatures: [...childSignatures].reverse(),
      type: 'multisig',
    })
    const selected = SignatureEnvelope.sortMultisigApprovals({
      account,
      config: currentConfig,
      payload: KeyAuthorization.getSignPayload(authorization),
      signatures: [selectedNested, SignatureEnvelope.deserialize(approval_2)],
    })
    const operation = {
      ...keyAuthorizationPending,
      approvals: [SignatureEnvelope.serialize(retainedNested), approval_2],
      keyAuthorization: KeyAuthorization.serialize(
        KeyAuthorization.from(authorization, {
          signature: {
            account,
            config: currentConfig,
            signatures: selected,
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
      config,
      payload: KeyAuthorization.getSignPayload(authorization),
      signatures: [
        SignatureEnvelope.deserialize(approval_1),
        SignatureEnvelope.deserialize(approval_2),
      ],
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

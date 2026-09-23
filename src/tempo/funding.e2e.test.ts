import {
  AbiFunction,
  AbiParameters,
  Address,
  Hash,
  Hex,
  P256,
  WebAuthnP256,
  Secp256k1,
} from 'ox'
import { afterAll, beforeAll, describe, expect, test } from 'vp/test'
import { accounts } from '../../test/constants/accounts.js'
import { rpcUrl } from '../../test/tempo/prool.js'
import * as Funding from './Funding.js'
import * as FundingPolicy from './FundingPolicy.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as NativeDexFunding from './NativeDexFunding.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as Transaction from './Transaction.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const maker = accounts[0]
const output = '0x20c0000000000000000000000000000000000000' as const
const dex = '0xdec0000000000000000000000000000000000000' as const
const factory = '0x20fc000000000000000000000000000000000000' as const
const source = '0x1120000000000000000000000000000000000001' as const
const policyAddress = '0x1120000000000000000000000000000000000002' as const
const recipient = '0x8888888888888888888888888888888888888888' as const
const unit = 1_000_000n
const max = 2n ** 256n - 1n
const transfer = AbiFunction.from(
  'function transfer(address to, uint256 amount) returns (bool)',
)
const mint = AbiFunction.from('function mint(address to, uint256 amount)')
const balanceOf = AbiFunction.from(
  'function balanceOf(address account) view returns (uint256)',
)
const createPolicy = AbiFunction.from(
  'function createPolicy(address[] admins, (uint16 maxSlippageBps, (address token, (address target, bytes data)[] sources)[] routes) rules) returns (uint64)',
)
const getPolicy = AbiFunction.from(
  'function getPolicy(uint64 policyId) view returns ((address[] admins, bytes32 rulesHash))',
)
let chainId: number
let inputs: Address.Address[]

type Receipt = {
  status: Hex.Hex
  transactionHash: Hex.Hex
  logs: readonly {
    address: Address.Address
    topics: readonly Hex.Hex[]
    data: Hex.Hex
  }[]
}
async function rpc<T>(
  method: string,
  params: readonly unknown[] = [],
): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const result = (await response.json()) as {
    result: T
    error?: { message: string }
  }
  if (result.error) throw new Error(result.error.message)
  return result.result
}

function wallet() {
  const privateKey = Secp256k1.randomPrivateKey()
  return {
    privateKey,
    address: Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey })),
  }
}

async function send(
  owner: { address: Address.Address; privateKey: Hex.Hex },
  request: Partial<TxEnvelopeTempo.TxEnvelopeTempo> = {},
  access?: ReturnType<typeof wallet> & {
    sign?: (payload: Hex.Hex) => SignatureEnvelope.Primitive
  },
) {
  const nonce = BigInt(
    await rpc<Hex.Hex>('eth_getTransactionCount', [owner.address, 'pending']),
  )
  const tx = TxEnvelopeTempo.from({
    chainId,
    calls: [{ to: recipient }],
    gas: 20_000_000n,
    maxFeePerGas: 20_000_000_000n,
    nonce,
    feeToken: output,
    feePayerSignature: owner.address === maker.address ? undefined : null,
    ...request,
  })
  const payload = TxEnvelopeTempo.getSignPayload(
    tx,
    access ? { from: owner.address } : {},
  )
  const inner = access?.sign
    ? access.sign(payload)
    : SignatureEnvelope.from(
        Secp256k1.sign({
          privateKey: access?.privateKey ?? owner.privateKey,
          payload,
        }),
      )
  const signature = access
    ? SignatureEnvelope.from({
        type: 'keychain',
        userAddress: owner.address,
        inner,
      })
    : inner
  const feePayerSignature = Secp256k1.sign({
    privateKey: maker.privateKey,
    payload: TxEnvelopeTempo.getFeePayerSignPayload(tx, {
      sender: owner.address,
    }),
  })
  const serialized = TxEnvelopeTempo.serialize(tx, {
    signature,
    ...(tx.feePayerSignature === undefined ? {} : { feePayerSignature }),
  })
  return rpc<Receipt>('eth_sendRawTransactionSync', [serialized])
}

async function balance(token: Address.Address, account: Address.Address) {
  return AbiFunction.decodeResult(
    balanceOf,
    await rpc<Hex.Hex>('eth_call', [
      { to: token, data: AbiFunction.encodeData(balanceOf, [account]) },
      'latest',
    ]),
  )
}

function requirement(policyRules?: Hex.Hex): Funding.Requirement {
  return {
    token: output,
    amount: 50n * unit,
    policyRules,
    slippageBps: 100,
    sources: inputs.map((tokenIn, i) => ({
      target: source,
      data: NativeDexFunding.encode({
        tokenIn,
        maxAmountIn: i === 0 ? 30n * unit : undefined,
      }),
    })),
  }
}
function rules(): FundingPolicy.Rules {
  return { maxSlippageBps: 100, sources: { [output]: requirement().sources } }
}
async function owner() {
  const account = wallet()
  expect(
    (
      await send(maker, {
        calls: inputs.map((to) => ({
          to,
          data: AbiFunction.encodeData(mint, [account.address, 500n * unit]),
        })),
      })
    ).status,
  ).toBe('0x1')
  return account
}
function authorization(
  root: ReturnType<typeof wallet>,
  key: ReturnType<typeof wallet>,
  fundingPolicy: FundingPolicy.Authorization,
  limit = 50n * unit,
) {
  const value = {
    chainId: BigInt(chainId),
    address: key.address,
    type: 'secp256k1' as const,
    limits: [{ token: output, limit }],
    fundingPolicy,
  }
  return KeyAuthorization.from(value, {
    signature: SignatureEnvelope.from(
      Secp256k1.sign({
        privateKey: root.privateKey,
        payload: KeyAuthorization.getSignPayload(value),
      }),
    ),
  })
}

beforeAll(async () => {
  expect(await rpc<string>('web3_clientVersion')).toContain('4926397')
  chainId = Number(await rpc<Hex.Hex>('eth_chainId'))
  const tokenAddress = AbiFunction.from(
    'function getTokenAddress(address sender, bytes32 salt) view returns (address)',
  )
  const createToken = AbiFunction.from(
    'function createToken(string name, string symbol, string currency, address quoteToken, address admin, bytes32 salt) returns (address)',
  )
  const grantRole = AbiFunction.from(
    'function grantRole(bytes32 role, address account)',
  )
  const approve = AbiFunction.from(
    'function approve(address spender, uint256 amount) returns (bool)',
  )
  const place = AbiFunction.from(
    'function place(address token, uint128 amount, bool isBid, int16 tick) returns (uint128)',
  )
  expect(
    (
      await send(maker, {
        calls: [
          { to: output, data: AbiFunction.encodeData(approve, [dex, max]) },
        ],
      })
    ).status,
  ).toBe('0x1')
  inputs = []
  for (let i = 0; i < 2; i++) {
    const salt = Hex.random(32)
    const token = AbiFunction.decodeResult(
      tokenAddress,
      await rpc<Hex.Hex>('eth_call', [
        {
          to: factory,
          data: AbiFunction.encodeData(tokenAddress, [maker.address, salt]),
        },
        'latest',
      ]),
    )
    expect(
      (
        await send(maker, {
          calls: [
            {
              to: factory,
              data: AbiFunction.encodeData(createToken, [
                'Funding input',
                i === 0 ? 'USDC.e' : 'OUSD',
                'USD',
                output,
                maker.address,
                salt,
              ]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    expect(
      (
        await send(maker, {
          calls: [
            {
              to: token,
              data: AbiFunction.encodeData(grantRole, [
                Hash.keccak256(Hex.fromString('ISSUER_ROLE')),
                maker.address,
              ]),
            },
            {
              to: dex,
              data: AbiFunction.encodeData(place, [
                token,
                100_000n * unit,
                true,
                0,
              ]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    inputs.push(token)
  }
})
afterAll(async () => {
  await fetch(`${rpcUrl}/stop`)
})

describe('owner funding', () => {
  test('funds 30 from the first source and 20 from the second, with a sponsor', async () => {
    const account = await owner()
    const receipt = await send(account, {
      requireFunds: [requirement()],
      calls: [
        {
          to: output,
          data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
        },
      ],
    })
    expect(receipt.status).toBe('0x1')
    expect(await balance(inputs[0]!, account.address)).toBe(470n * unit)
    expect(await balance(inputs[1]!, account.address)).toBe(480n * unit)
    expect(await balance(output, account.address)).toBe(0n)
    const tx = Transaction.fromRpc(
      await rpc<Transaction.Rpc>('eth_getTransactionByHash', [
        receipt.transactionHash,
      ]),
    )
    expect(tx.requireFunds).toEqual([requirement()])
  })
  test('application failure rolls back input debits', async () => {
    const account = await owner()
    const receipt = await send(account, {
      requireFunds: [requirement()],
      calls: [
        {
          to: output,
          data: AbiFunction.encodeData(transfer, [recipient, 51n * unit]),
        },
      ],
    })
    expect(receipt.status).toBe('0x0')
    expect(await balance(inputs[0]!, account.address)).toBe(500n * unit)
    expect(await balance(output, account.address)).toBe(0n)
  })
})

describe('policy funding', () => {
  test('creates a policy with the same hash as Ox', async () => {
    const value = rules()
    const receipt = await send(maker, {
      calls: [
        {
          to: policyAddress,
          data: AbiFunction.encodeData(createPolicy, [
            [maker.address],
            {
              maxSlippageBps: value.maxSlippageBps,
              routes: FundingPolicy.toRoutes(value),
            },
          ]),
        },
      ],
    })
    expect(receipt.status).toBe('0x1')
    const event = receipt.logs.find(
      (log) => log.address.toLowerCase() === policyAddress,
    )!
    const policyId = BigInt(event.topics[1]!)
    const result = await rpc<Hex.Hex>('eth_call', [
      {
        to: policyAddress,
        data: AbiFunction.encodeData(getPolicy, [policyId]),
      },
      'latest',
    ])
    const [policy] = AbiParameters.decode(
      [
        {
          type: 'tuple',
          components: [
            { name: 'admins', type: 'address[]' },
            { name: 'rulesHash', type: 'bytes32' },
          ],
        },
      ],
      result,
    )
    expect(policy.rulesHash).toBe(FundingPolicy.hash(value))
    const root = await owner()
    const key = wallet()
    const payment = await send(
      root,
      {
        keyAuthorization: authorization(root, key, policyId),
        requireFunds: [requirement(FundingPolicy.encode(value))],
        calls: [
          {
            to: output,
            data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
          },
        ],
      },
      key,
    )
    expect(payment.status).toBe('0x1')
  })
  test('creates inline policy, installs key, funds and pays without double charging', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    const receipt = await send(
      root,
      {
        keyAuthorization: authorization(root, key, {
          admins: [root.address],
          rules: value,
        }),
        requireFunds: [requirement(FundingPolicy.encode(value))],
        calls: [
          {
            to: output,
            data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
          },
        ],
      },
      key,
    )
    expect(receipt.status).toBe('0x1')
    expect(await balance(inputs[0]!, root.address)).toBe(470n * unit)
    const exhausted = await send(
      root,
      { requireFunds: [requirement(FundingPolicy.encode(value))] },
      key,
    )
    expect(exhausted.status).toBe('0x0')
    expect(await balance(inputs[0]!, root.address)).toBe(470n * unit)
  })
})

describe('funding authorization boundaries', () => {
  test('reuses an installed key, then rejects the exhausted output budget', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    const installed = await send(
      root,
      {
        keyAuthorization: authorization(
          root,
          key,
          { admins: [root.address], rules: value },
          100n * unit,
        ),
      },
      key,
    )
    expect(installed.status).toBe('0x1')
    for (let i = 0; i < 2; i++) {
      const payment = await send(
        root,
        {
          requireFunds: [requirement(FundingPolicy.encode(value))],
          calls: [
            {
              to: output,
              data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
            },
          ],
        },
        key,
      )
      expect(payment.status).toBe('0x1')
    }
    expect(
      (
        await send(
          root,
          { requireFunds: [requirement(FundingPolicy.encode(value))] },
          key,
        )
      ).status,
    ).toBe('0x0')
    expect(await balance(inputs[0]!, root.address)).toBe(440n * unit)
  })

  test('rejects missing, tampered and mismatched rules before debiting inputs', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    expect(
      (
        await send(
          root,
          {
            keyAuthorization: authorization(root, key, {
              admins: [root.address],
              rules: value,
            }),
          },
          key,
        )
      ).status,
    ).toBe('0x1')
    for (const policyRules of [
      undefined,
      '0xab' as const,
      FundingPolicy.encode({ ...value, maxSlippageBps: 101 }),
    ]) {
      expect(
        (await send(root, { requireFunds: [requirement(policyRules)] }, key))
          .status,
      ).toBe('0x0')
      expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
    }
  })

  test('rejects excessive slippage, reversed sources and unapproved output', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    expect(
      (
        await send(
          root,
          {
            keyAuthorization: authorization(root, key, {
              admins: [root.address],
              rules: value,
            }),
          },
          key,
        )
      ).status,
    ).toBe('0x1')
    const request = requirement(FundingPolicy.encode(value))
    for (const entry of [
      { ...request, slippageBps: 101 },
      { ...request, sources: [...request.sources].reverse() },
      { ...request, token: inputs[0]! },
      {
        ...request,
        sources: [
          {
            target: source,
            data: NativeDexFunding.encode({ tokenIn: output }),
          },
        ],
      },
    ]) {
      expect((await send(root, { requireFunds: [entry] }, key)).status).toBe(
        '0x0',
      )
      expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
    }
  })

  test('uses existing balances and treats repeated requirements as target balances', async () => {
    const root = await owner()
    expect(
      (
        await send(maker, {
          calls: [
            {
              to: output,
              data: AbiFunction.encodeData(transfer, [
                root.address,
                50n * unit,
              ]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    const entry = {
      token: output,
      amount: 50n * unit,
      sources: [],
      slippageBps: 0,
    }
    expect(
      (
        await send(root, {
          requireFunds: [entry, entry],
          calls: [
            {
              to: output,
              data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
  })

  test('insufficient input and caller caps roll back earlier contributions', async () => {
    const root = await owner()
    const entry = { ...requirement(), sources: [requirement().sources[0]!] }
    expect((await send(root, { requireFunds: [entry] })).status).toBe('0x0')
    expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
    const empty = wallet()
    expect((await send(empty, { requireFunds: [requirement()] })).status).toBe(
      '0x0',
    )
  })

  test('owner funding rejects policy rules', async () => {
    const root = await owner()
    expect(
      (
        await send(root, {
          requireFunds: [requirement(FundingPolicy.encode(rules()))],
        })
      ).status,
    ).toBe('0x0')
  })

  test('updated policy rules invalidate the previous witness', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    const installed = await send(
      root,
      {
        keyAuthorization: authorization(root, key, {
          admins: [root.address],
          rules: value,
        }),
      },
      key,
    )
    expect(installed.status).toBe('0x1')
    const event = installed.logs.find(
      (log) => log.address.toLowerCase() === policyAddress,
    )!
    const id = BigInt(event.topics[1]!)
    const setRules = AbiFunction.from(
      'function setRules(uint64 policyId, (uint16 maxSlippageBps, (address token, (address target, bytes data)[] sources)[] routes) rules)',
    )
    const updated = { ...value, maxSlippageBps: 50 }
    expect(
      (
        await send(root, {
          calls: [
            {
              to: policyAddress,
              data: AbiFunction.encodeData(setRules, [
                id,
                { maxSlippageBps: 50, routes: FundingPolicy.toRoutes(updated) },
              ]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    expect(
      (
        await send(
          root,
          { requireFunds: [requirement(FundingPolicy.encode(value))] },
          key,
        )
      ).status,
    ).toBe('0x0')
    expect(
      (
        await send(
          root,
          {
            requireFunds: [
              {
                ...requirement(FundingPolicy.encode(updated)),
                slippageBps: undefined,
              },
            ],
          },
          key,
        )
      ).status,
    ).toBe('0x1')
  })
})

describe('key validity and signature families', () => {
  test.each(['p256', 'webAuthn'] as const)(
    'funds with a %s access key',
    async (type) => {
      const root = await owner()
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const key = {
        address: Address.fromPublicKey(publicKey),
        privateKey,
        sign(payload: Hex.Hex): SignatureEnvelope.Primitive {
          if (type === 'p256')
            return {
              type,
              publicKey,
              prehash: false,
              signature: P256.sign({ payload, privateKey }),
            }
          const webAuthn = WebAuthnP256.getSignPayload({
            challenge: payload,
            rpId: 'localhost',
            origin: 'http://localhost',
          })
          return {
            type,
            publicKey,
            metadata: webAuthn.metadata,
            signature: P256.sign({
              payload: webAuthn.payload,
              privateKey,
              hash: true,
            }),
          }
        },
      }
      const policy = rules()
      const unsigned = {
        chainId: BigInt(chainId),
        address: key.address,
        type,
        fundingPolicy: { admins: [root.address], rules: policy },
        limits: [{ token: output, limit: 50n * unit }],
      }
      const keyAuthorization = KeyAuthorization.from(unsigned, {
        signature: SignatureEnvelope.from(
          Secp256k1.sign({
            privateKey: root.privateKey,
            payload: KeyAuthorization.getSignPayload(unsigned),
          }),
        ),
      })
      expect(
        (
          await send(
            root,
            {
              keyAuthorization,
              requireFunds: [requirement(FundingPolicy.encode(policy))],
              calls: [
                {
                  to: output,
                  data: AbiFunction.encodeData(transfer, [
                    recipient,
                    50n * unit,
                  ]),
                },
              ],
            },
            key,
          )
        ).status,
      ).toBe('0x1')
    },
  )

  test('rejects a revoked funding key', async () => {
    const root = await owner()
    const key = wallet()
    const value = rules()
    expect(
      (
        await send(
          root,
          {
            keyAuthorization: authorization(root, key, {
              admins: [root.address],
              rules: value,
            }),
          },
          key,
        )
      ).status,
    ).toBe('0x1')
    const revoke = AbiFunction.from('function revokeKey(address keyId)')
    expect(
      (
        await send(root, {
          calls: [
            {
              to: '0xaaaaaaaa00000000000000000000000000000000',
              data: AbiFunction.encodeData(revoke, [key.address]),
            },
          ],
        })
      ).status,
    ).toBe('0x1')
    await expect(
      send(
        root,
        { requireFunds: [requirement(FundingPolicy.encode(value))] },
        key,
      ),
    ).rejects.toThrow()
    expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
  })
})

test('owner funding also works without a sponsor and cannot fund its own fees', async () => {
  const root = await owner()
  await expect(
    send(root, { feePayerSignature: undefined, requireFunds: [requirement()] }),
  ).rejects.toThrow()
  expect(
    (
      await send(maker, {
        calls: [
          {
            to: output,
            data: AbiFunction.encodeData(transfer, [root.address, 10n * unit]),
          },
        ],
      })
    ).status,
  ).toBe('0x1')
  expect(
    (
      await send(root, {
        feePayerSignature: undefined,
        requireFunds: [requirement()],
        calls: [
          {
            to: output,
            data: AbiFunction.encodeData(transfer, [recipient, 50n * unit]),
          },
        ],
      })
    ).status,
  ).toBe('0x1')
})

test('rejects an installed funding key after expiry', async () => {
  const root = await owner()
  const key = wallet()
  const value = rules()
  const block = await rpc<{ timestamp: Hex.Hex }>('eth_getBlockByNumber', [
    'latest',
    false,
  ])
  const expiry = Number(block.timestamp) + 10
  const unsigned = {
    chainId: BigInt(chainId),
    address: key.address,
    type: 'secp256k1' as const,
    expiry,
    fundingPolicy: { admins: [root.address], rules: value },
  }
  const keyAuthorization = KeyAuthorization.from(unsigned, {
    signature: SignatureEnvelope.from(
      Secp256k1.sign({
        privateKey: root.privateKey,
        payload: KeyAuthorization.getSignPayload(unsigned),
      }),
    ),
  })
  expect((await send(root, { keyAuthorization }, key)).status).toBe('0x1')
  for (let i = 0; i < 200; i++) {
    const latest = await rpc<{ timestamp: Hex.Hex }>('eth_getBlockByNumber', [
      'latest',
      false,
    ])
    if (Number(latest.timestamp) > expiry) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  await expect(
    send(
      root,
      { requireFunds: [requirement(FundingPolicy.encode(value))] },
      key,
    ),
  ).rejects.toThrow()
  expect(await balance(inputs[0]!, root.address)).toBe(500n * unit)
})

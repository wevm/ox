import { Evm, State } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

const self = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357' as const
const other = '0x00000000000000000000000000000000000000c0' as const

// Program tail: store the stack top at memory 0 and return the word.
const ret = '5f5260205ff3'

function returned(result: Evm.Result): `0x${string}` {
  Evm.assertSuccess(result)
  return result.output
}

describe('account opcodes', () => {
  test('BALANCE: value, and cold 2600 / warm 100', () => {
    const state = State.fromMemory({
      accounts: { [other]: { balance: 42n } },
    })
    // PUSH1 other-low-byte..: full address push is PUSH20.
    const push = `73${other.slice(2)}`
    const result = Evm.run({
      bytecode: `0x${push}31${push}31${ret}`,
      state,
    })
    expect(returned(result)).toBe(`0x${'2a'.padStart(64, '0')}`)
    // 3 + 2600 + 3 + 100 + tail (2 + 6 + 3 + 2)
    expect(result.gasUsed).toBe(2719n)
  })

  test('BALANCE of a non-existent account is 0', () => {
    const result = Evm.run({ bytecode: `0x5f31${ret}` })
    expect(returned(result)).toBe(`0x${'00'.repeat(32)}`)
  })

  test('SELFBALANCE reads the executing account', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 7n } },
    })
    const result = Evm.run({ address: self, bytecode: `0x47${ret}`, state })
    expect(returned(result)).toBe(`0x${'07'.padStart(64, '0')}`)
    // 5 + 13
    expect(result.gasUsed).toBe(18n)
  })

  test('EXTCODESIZE / EXTCODEHASH / EXTCODECOPY', () => {
    const state = State.fromMemory({
      accounts: {
        [other]: { code: '0x60016002' },
        // Non-empty (has balance) but codeless.
        [self]: { balance: 1n },
      },
    })
    const push = `73${other.slice(2)}`

    // Size of deployed code.
    expect(returned(Evm.run({ bytecode: `0x${push}3b${ret}`, state }))).toBe(
      `0x${'04'.padStart(64, '0')}`,
    )

    // Hash of deployed code (keccak256 of 0x60016002).
    expect(returned(Evm.run({ bytecode: `0x${push}3f${ret}`, state }))).toBe(
      '0xb19850dcf719b03fe1369d0896d0f58edfad601bcc6f2ad0e248cf3562d4df14',
    )

    // Hash of a non-existent account is 0.
    expect(returned(Evm.run({ bytecode: `0x5f3f${ret}`, state }))).toBe(
      `0x${'00'.repeat(32)}`,
    )

    // Hash of an existing, codeless, non-empty account is keccak256('').
    const pushSelf = `73${self.slice(2)}`
    expect(
      returned(Evm.run({ bytecode: `0x${pushSelf}3f${ret}`, state })),
    ).toBe('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')

    // Copy 4 code bytes to memory.
    const copy = Evm.run({
      bytecode: `0x60045f5f${push}3c5f51${ret}`,
      state,
    })
    expect(returned(copy)).toBe(`0x60016002${'00'.repeat(28)}`)
  })
})

describe('block and transaction environment', () => {
  test('block opcodes read the configured environment', () => {
    const result = Evm.run({
      block: {
        baseFeePerGas: 7n,
        blobBaseFee: 3n,
        coinbase: other,
        gasLimit: 123n,
        number: 42n,
        prevRandao: `0x${'aa'.repeat(32)}`,
        timestamp: 1000n,
      },
      // COINBASE TIMESTAMP NUMBER PREVRANDAO GASLIMIT CHAINID BASEFEE
      // BLOBBASEFEE — sum them (7 ADDs) and return.
      bytecode: `0x4142434445464848014801014601450144014301420141${ret}`,
      chainId: 5n,
    })
    expect(result.status).toBe('success')
  })

  test('NUMBER / TIMESTAMP / COINBASE / CHAINID / BASEFEE / BLOBBASEFEE', () => {
    const options = {
      block: {
        baseFeePerGas: 7n,
        blobBaseFee: 3n,
        coinbase: other,
        number: 42n,
        timestamp: 1000n,
      },
      chainId: 5n,
    }
    expect(returned(Evm.run({ ...options, bytecode: `0x43${ret}` }))).toBe(
      `0x${'2a'.padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x42${ret}` }))).toBe(
      `0x${(1000).toString(16).padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x41${ret}` }))).toBe(
      `0x${other.slice(2).padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x46${ret}` }))).toBe(
      `0x${'05'.padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x48${ret}` }))).toBe(
      `0x${'07'.padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x4a${ret}` }))).toBe(
      `0x${'03'.padStart(64, '0')}`,
    )
  })

  test('ADDRESS / CALLER / ORIGIN / CALLVALUE / GASPRICE', () => {
    const options = {
      address: self,
      caller: other,
      gasPrice: 9n,
      value: 11n,
    } as const
    expect(returned(Evm.run({ ...options, bytecode: `0x30${ret}` }))).toBe(
      `0x${self.slice(2).padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x33${ret}` }))).toBe(
      `0x${other.slice(2).padStart(64, '0')}`,
    )
    // origin defaults to caller.
    expect(returned(Evm.run({ ...options, bytecode: `0x32${ret}` }))).toBe(
      `0x${other.slice(2).padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x34${ret}` }))).toBe(
      `0x${'0b'.padStart(64, '0')}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x3a${ret}` }))).toBe(
      `0x${'09'.padStart(64, '0')}`,
    )
  })

  test('BLOCKHASH: in-window from state, out-of-window is 0', () => {
    const state = State.fromMemory({
      blockHashes: { 41: `0x${'ab'.repeat(32)}` },
    })
    const options = { block: { number: 42n }, state }
    // PUSH1 41, BLOCKHASH
    expect(returned(Evm.run({ ...options, bytecode: `0x602940${ret}` }))).toBe(
      `0x${'ab'.repeat(32)}`,
    )
    // The current block and future blocks are 0.
    expect(returned(Evm.run({ ...options, bytecode: `0x602a40${ret}` }))).toBe(
      `0x${'00'.repeat(32)}`,
    )
    // More than 256 back is 0 (block 10_000 asking for 9_000).
    expect(
      returned(
        Evm.run({
          block: { number: 10_000n },
          bytecode: `0x612328${'40'}${ret}`,
          state,
        }),
      ),
    ).toBe(`0x${'00'.repeat(32)}`)
  })

  test('BLOBHASH: indexed, out-of-range is 0', () => {
    const options = {
      blobHashes: [`0x${'01'.repeat(32)}`, `0x${'02'.repeat(32)}`] as const,
    }
    expect(returned(Evm.run({ ...options, bytecode: `0x5f49${ret}` }))).toBe(
      `0x${'01'.repeat(32)}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x600149${ret}` }))).toBe(
      `0x${'02'.repeat(32)}`,
    )
    expect(returned(Evm.run({ ...options, bytecode: `0x600249${ret}` }))).toBe(
      `0x${'00'.repeat(32)}`,
    )
  })
})

describe('transient storage', () => {
  test('TSTORE/TLOAD round-trip; cleared across runs', () => {
    // PUSH1 42, PUSH1 1, TSTORE, PUSH1 1, TLOAD, return.
    const bytecode = `0x602a60015d60015c${ret}` as const
    const result = Evm.run({ bytecode })
    expect(returned(result)).toBe(`0x${'2a'.padStart(64, '0')}`)
    // 3 + 3 + 100 + 3 + 100 + 13
    expect(result.gasUsed).toBe(222n)

    // A fresh run does not see it.
    expect(returned(Evm.run({ bytecode: `0x60015c${ret}` }))).toBe(
      `0x${'00'.repeat(32)}`,
    )
  })

  test('TSTORE in a static context halts', () => {
    const result = Evm.run({ bytecode: '0x5f5f5d', static: true })
    expect(result.status).toBe('halted')
  })
})

describe('logs', () => {
  test('LOG2 emits with topics, data, and exact gas', () => {
    // Store 42 at memory 0; LOG2(offset 0, len 32, topics 7, 9).
    // Push order: topic2, topic1, length, offset (offset on top).
    const result = Evm.run({
      address: self,
      bytecode: '0x602a5f526009600760205fa2',
    })
    Evm.assertSuccess(result)
    expect(result.logs).toMatchInlineSnapshot(`
      [
        {
          "address": "0x9F1fdAb6458c5fc642fa0F4C5af7473C46837357",
          "data": "0x000000000000000000000000000000000000000000000000000000000000002a",
          "topics": [
            "0x0000000000000000000000000000000000000000000000000000000000000007",
            "0x0000000000000000000000000000000000000000000000000000000000000009",
          ],
        },
      ]
    `)
    // 3+2+6 (store) + 3+3+2+3 (pushes) + 375 + 750 + 256 (data)
    expect(result.gasUsed).toBe(1403n)
  })

  test('LOG0 in a static context halts', () => {
    const result = Evm.run({ bytecode: '0x5f5fa0', static: true })
    expect(result.status).toBe('halted')
  })
})

describe('selfdestruct (EIP-6780)', () => {
  test('moves the balance without destroying a pre-existing account', () => {
    const state = State.fromMemory({
      accounts: { [self]: { balance: 100n, code: '0x00' } },
    })
    // PUSH20 beneficiary, SELFDESTRUCT.
    const result = Evm.run({
      address: self,
      bytecode: `0x73${other.slice(2)}ff`,
      state,
    })
    Evm.assertSuccess(result)
    // 3 + 5000 + 2600 (cold) + 25000 (new account, value moved)
    expect(result.gasUsed).toBe(32_603n)
    expect(state.getAccount(other)?.balance).toBe(100n)
    // Not created this transaction — account survives with zero balance.
    expect(state.getAccount(self)?.balance).toBe(0n)
    expect(state.getCode(self)).toBe('0x00')
  })

  test('no new-account charge when the beneficiary exists', () => {
    const state = State.fromMemory({
      accounts: {
        [other]: { balance: 1n },
        [self]: { balance: 100n },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x73${other.slice(2)}ff`,
      state,
    })
    Evm.assertSuccess(result)
    // 3 + 5000 + 2600
    expect(result.gasUsed).toBe(7603n)
    expect(state.getAccount(other)?.balance).toBe(101n)
  })

  test('no new-account charge when the beneficiary is empty', () => {
    const state = State.fromMemory({
      accounts: {
        [other]: {},
        [self]: { balance: 100n },
      },
    })
    const result = Evm.run({
      address: self,
      bytecode: `0x73${other.slice(2)}ff`,
      state,
    })
    Evm.assertSuccess(result)
    expect(result.gasUsed).toBe(7603n)
    expect(state.getAccount(other)?.balance).toBe(100n)
  })

  test('static context halts', () => {
    const result = Evm.run({ bytecode: '0x5fff', static: true })
    expect(result.status).toBe('halted')
  })
})

describe('state commitment', () => {
  test('read-only runs do not write fetched state', () => {
    const writes: string[] = []
    const source = State.from({
      async: false,
      getAccount: () => ({
        balance: 42n,
        code: '0x',
        hasStorage: false,
        nonce: 0n,
      }),
      getBlockHash: () => `0x${'00'.repeat(32)}` as `0x${string}`,
      getCode: () => '0x',
      getStorage: () => 7n,
      putAccount: (address) => writes.push(`account:${address}`),
      putStorage: (address, slot) => writes.push(`storage:${address}:${slot}`),
    })
    const push = `73${other.slice(2)}`
    Evm.run({
      address: self,
      bytecode: `0x${push}31506001545000`,
      state: source,
    })
    expect(writes).toMatchInlineSnapshot(`[]`)
  })

  test('reverted runs leave the source untouched', () => {
    const state = State.fromMemory({
      accounts: { [self]: { storage: { '0x01': '0x2a' } } },
    })
    // SSTORE 7 at slot 1, then REVERT.
    const result = Evm.run({
      address: self,
      bytecode: '0x60076001555f5ffd',
      state,
    })
    expect(result.status).toBe('reverted')
    expect(state.getStorage(self, 1n)).toBe(0x2an)
  })
})

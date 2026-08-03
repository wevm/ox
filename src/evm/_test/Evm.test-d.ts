import { Evm, State, Transaction } from 'ox/evm'
import { expectTypeOf } from 'vp/test'

const state = State.fromMemory()
const evm = Evm.from({ state })

expectTypeOf(evm).toEqualTypeOf<Evm.Evm<State.Memory>>()
expectTypeOf(
  Evm.call(evm, {
    to: '0x0000000000000000000000000000000000000000',
  }),
).toEqualTypeOf<Evm.Result>()

expectTypeOf(
  Evm.transact(evm, {
    chainId: 1,
    from: '0x0000000000000000000000000000000000000000',
    gas: 21_000n,
    gasPrice: 1n,
    nonce: 0n,
    to: '0x0000000000000000000000000000000000000000',
    type: 'legacy',
  }),
).toEqualTypeOf<Evm.Receipt>()

const custom = {
  type: 'custom',
} satisfies Transaction.Handler<
  'custom',
  { chainId: number; from: `0x${string}`; type: 'custom' }
>
const extended = Evm.from({
  state,
  transactions: [...Transaction.mainnet(), custom],
})
Evm.transact(extended, {
  chainId: 1,
  from: '0x0000000000000000000000000000000000000000',
  type: 'custom',
})

const number: bigint | undefined = undefined

Evm.run({
  block: { number },
  bytecode: '0x00',
})

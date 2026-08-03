import { Evm, State } from 'ox/evm'
import { expectTypeOf } from 'vp/test'

const state = State.fromMemory()
const evm = Evm.from({ state })

expectTypeOf(evm).toEqualTypeOf<Evm.Evm<State.Memory>>()
expectTypeOf(
  Evm.call(evm, {
    to: '0x0000000000000000000000000000000000000000',
  }),
).toEqualTypeOf<Evm.Result>()

const number: bigint | undefined = undefined

Evm.run({
  block: { number },
  bytecode: '0x00',
})

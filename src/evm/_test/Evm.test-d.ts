import { Evm } from 'ox/evm'

const number: bigint | undefined = undefined

Evm.run({
  block: { number },
  bytecode: '0x00',
})

import type { Opcode } from 'ox/evm'
import { expectTypeOf, test } from 'vp/test'

test('Name', () => {
  // Every mnemonic in a generated range is assignable, not just the endpoints.
  expectTypeOf<'PUSH2'>().toExtend<Opcode.Name>()
  expectTypeOf<'PUSH31'>().toExtend<Opcode.Name>()
  expectTypeOf<'DUP2'>().toExtend<Opcode.Name>()
  expectTypeOf<'DUP15'>().toExtend<Opcode.Name>()
  expectTypeOf<'SWAP2'>().toExtend<Opcode.Name>()
  expectTypeOf<'SWAP15'>().toExtend<Opcode.Name>()

  expectTypeOf<'PUSH33'>().not.toExtend<Opcode.Name>()
  expectTypeOf<'DUP17'>().not.toExtend<Opcode.Name>()
})

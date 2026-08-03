import { Opcode } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(Opcode)).toMatchInlineSnapshot(`
    [
      "codes",
      "toName",
      "disassemble",
    ]
  `)
})

describe('codes', () => {
  test('behavior: covers every PUSH, DUP, and SWAP mnemonic', () => {
    expect(Opcode.codes.PUSH2).toBe(0x61)
    expect(Opcode.codes.PUSH31).toBe(0x7e)
    expect(Opcode.codes.DUP2).toBe(0x81)
    expect(Opcode.codes.DUP15).toBe(0x8e)
    expect(Opcode.codes.SWAP2).toBe(0x91)
    expect(Opcode.codes.SWAP15).toBe(0x9e)
  })

  test('behavior: every entry round-trips through toName', () => {
    for (const [name, code] of Object.entries(Opcode.codes))
      expect(Opcode.toName(code)).toBe(name)
  })
})

describe('toName', () => {
  test('behavior: resolves mnemonics', () => {
    expect(Opcode.toName(0x00)).toMatchInlineSnapshot(`"STOP"`)
    expect(Opcode.toName(0x01)).toMatchInlineSnapshot(`"ADD"`)
    expect(Opcode.toName(0x1e)).toMatchInlineSnapshot(`"CLZ"`)
    expect(Opcode.toName(0x20)).toMatchInlineSnapshot(`"KECCAK256"`)
    expect(Opcode.toName(0xff)).toMatchInlineSnapshot(`"SELFDESTRUCT"`)
  })

  test('behavior: expands PUSH, DUP, and SWAP ranges', () => {
    expect(Opcode.toName(0x5f)).toMatchInlineSnapshot(`"PUSH0"`)
    expect(Opcode.toName(0x60)).toMatchInlineSnapshot(`"PUSH1"`)
    expect(Opcode.toName(0x7f)).toMatchInlineSnapshot(`"PUSH32"`)
    expect(Opcode.toName(0x80)).toMatchInlineSnapshot(`"DUP1"`)
    expect(Opcode.toName(0x8f)).toMatchInlineSnapshot(`"DUP16"`)
    expect(Opcode.toName(0x90)).toMatchInlineSnapshot(`"SWAP1"`)
    expect(Opcode.toName(0x9f)).toMatchInlineSnapshot(`"SWAP16"`)
  })

  test('behavior: undefined for unassigned bytes', () => {
    expect(Opcode.toName(0x0c)).toBeUndefined()
    expect(Opcode.toName(0x21)).toBeUndefined()
    expect(Opcode.toName(-1)).toBeUndefined()
    expect(Opcode.toName(256)).toBeUndefined()
  })
})

describe('disassemble', () => {
  test('behavior: decodes instructions', () => {
    expect(Opcode.disassemble('0x6001600201')).toMatchInlineSnapshot(`
      [
        {
          "code": 96,
          "name": "PUSH1",
          "offset": 0,
          "push": "0x01",
        },
        {
          "code": 96,
          "name": "PUSH1",
          "offset": 2,
          "push": "0x02",
        },
        {
          "code": 1,
          "name": "ADD",
          "offset": 4,
        },
      ]
    `)
  })

  test('behavior: does not treat PUSH data as instructions', () => {
    // The 0x5b here is PUSH1 data, not a JUMPDEST.
    expect(Opcode.disassemble('0x605b00')).toMatchInlineSnapshot(`
      [
        {
          "code": 96,
          "name": "PUSH1",
          "offset": 0,
          "push": "0x5b",
        },
        {
          "code": 0,
          "name": "STOP",
          "offset": 2,
        },
      ]
    `)
  })

  test('behavior: right-pads a truncated immediate', () => {
    expect(Opcode.disassemble('0x61ff')).toMatchInlineSnapshot(`
      [
        {
          "code": 97,
          "name": "PUSH2",
          "offset": 0,
          "push": "0xff00",
        },
      ]
    `)
  })

  test('behavior: accepts bytes', () => {
    expect(Opcode.disassemble(new Uint8Array([0x01]))).toMatchInlineSnapshot(`
      [
        {
          "code": 1,
          "name": "ADD",
          "offset": 0,
        },
      ]
    `)
  })

  test('behavior: undefined opcodes decode with no name', () => {
    expect(Opcode.disassemble('0x0c')).toMatchInlineSnapshot(`
      [
        {
          "code": 12,
          "name": undefined,
          "offset": 0,
        },
      ]
    `)
  })

  test('behavior: empty bytecode', () => {
    expect(Opcode.disassemble('0x')).toMatchInlineSnapshot(`[]`)
  })
})

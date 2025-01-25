import { BinaryStateTree, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'
import type { Node } from '../BinaryStateTree.js'

function getHeight(node: Node): number {
  if (node.type === 'empty') return 0
  if (node.type === 'stem') return 1
  return 1 + Math.max(getHeight(node.left), getHeight(node.right))
}

describe('insert', () => {
  test('behavior: single entry', () => {
    const tree = BinaryStateTree.create()
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(32)) as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    expect(getHeight(tree.root)).toBe(1)
    expect(
      Hex.fromBytes(BinaryStateTree.merkelize(tree)),
    ).toMatchInlineSnapshot(
      `"0x694545468677064fd833cddc8455762fe6b21c6cabe2fc172529e0f573181cd5"`,
    )
  })

  test('behavior: two entries, diff first bit', () => {
    const tree = BinaryStateTree.create()
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(32)) as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '80' + '00'.repeat(31)) as Hex.Hex),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )
    expect(getHeight(tree.root)).toBe(2)
    expect(
      Hex.fromBytes(BinaryStateTree.merkelize(tree)),
    ).toMatchInlineSnapshot(
      `"0x85fc622076752a6fcda2c886c18058d639066a83473d9684704b5a29455ed2ed"`,
    )
  })

  test('behavior: one stem, colocated values', () => {
    const tree = BinaryStateTree.create()
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + '03') as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + '04') as Hex.Hex),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + '09') as Hex.Hex),
      Bytes.fromHex(('0x' + '03'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + 'ff') as Hex.Hex),
      Bytes.fromHex(('0x' + '04'.repeat(32)) as Hex.Hex),
    )
    expect(getHeight(tree.root)).toBe(1)
    expect(
      Hex.fromBytes(BinaryStateTree.merkelize(tree)),
    ).toMatchInlineSnapshot(
      `"0xaa12acb5689a2dc03e9d7ab0350449c70cdad286750dc8ba1dd092f5e100191a"`,
    )
  })

  test('behavior: two stems, colocated values', () => {
    const tree = BinaryStateTree.create()

    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + '03') as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(31) + '04') as Hex.Hex),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )

    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '80'.repeat(31) + '03') as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '80'.repeat(31) + '04') as Hex.Hex),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )

    expect(getHeight(tree.root)).toBe(2)
    expect(
      Hex.fromBytes(BinaryStateTree.merkelize(tree)),
    ).toMatchInlineSnapshot(
      `"0xd8cb5a1f0611c2af9413c9fa179a4a1bf0eb6debc8d9e10d439b3e32371085ad"`,
    )
  })

  test('behavior: two keys match first 42 bits', () => {
    const tree = BinaryStateTree.create()
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '00'.repeat(5) + 'C0'.repeat(27)) as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(
        ('0x' + '00'.repeat(5) + 'E0' + '00'.repeat(26)) as Hex.Hex,
      ),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )
    expect(getHeight(tree.root)).toBe(1 + 42 + 1)
  })

  test('behavior: duplicate key', () => {
    const tree = BinaryStateTree.create()
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
    )
    BinaryStateTree.insert(
      tree,
      Bytes.fromHex(('0x' + '01'.repeat(32)) as Hex.Hex),
      Bytes.fromHex(('0x' + '02'.repeat(32)) as Hex.Hex),
    )
    expect(getHeight(tree.root)).toBe(1)
    expect(Hex.fromBytes(tree.root.values![1]!)).toMatchInlineSnapshot(
      `"0x0202020202020202020202020202020202020202020202020202020202020202"`,
    )
  })

  test('behavior: large number of entries', () => {
    const tree = BinaryStateTree.create()
    for (let i = 0; i < 1 << 8; i++) {
      const key = Bytes.fromHex(
        ('0x' + i.toString(16).padStart(2, '0') + '00'.repeat(31)) as Hex.Hex,
      )
      BinaryStateTree.insert(
        tree,
        key,
        Bytes.fromHex(('0x' + 'FF'.repeat(32)) as Hex.Hex),
      )
    }
    expect(getHeight(tree.root)).toBe(1 + 8)
  })

  test('behavior: merkleize multiple entries', () => {
    const tree = BinaryStateTree.create()
    const keys = [
      Bytes.fromHex(('0x' + '00'.repeat(32)) as Hex.Hex),
      Bytes.fromHex(('0x' + '80' + '00'.repeat(31)) as Hex.Hex),
      Bytes.fromHex(('0x' + '01' + '00'.repeat(31)) as Hex.Hex),
      Bytes.fromHex(('0x' + '81' + '00'.repeat(31)) as Hex.Hex),
    ]
    for (let i = 0; i < keys.length; i++) {
      const value = Bytes.fromHex(
        ('0x' +
          (i + 1).toString(16).padStart(2, '0') +
          '00'.repeat(31)) as Hex.Hex,
      )
      BinaryStateTree.insert(tree, keys[i]!, value)
    }
    expect(
      Hex.fromBytes(BinaryStateTree.merkelize(tree)),
    ).toMatchInlineSnapshot(
      `"0xe93c209026b8b00d76062638102ece415028bd104e1d892d5399375a323f2218"`,
    )
  })
})

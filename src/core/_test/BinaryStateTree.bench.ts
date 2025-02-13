import { bench } from 'vitest'
import * as BinaryStateTree from '../BinaryStateTree.js'
import * as Bytes from '../Bytes.js'
import type * as Hex from '../Hex.js'

bench('default', () => {
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
})

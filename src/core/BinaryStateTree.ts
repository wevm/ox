import { blake3 } from '@noble/hashes/blake3'

import * as Bytes from './Bytes.js'
import type { OneOf } from './internal/types.js'

export type BinaryStateTree = {
  root: Node
}

export type Node = OneOf<EmptyNode | StemNode | InternalNode>

export type EmptyNode = {
  type: 'empty'
}

export type InternalNode = {
  left: Node
  right: Node
  type: 'internal'
}

export type StemNode = {
  stem: Bytes.Bytes
  values: (Bytes.Bytes | undefined)[]
  type: 'stem'
}

export function create(): BinaryStateTree {
  return {
    root: emptyNode(),
  }
}

export function insert(
  tree: BinaryStateTree,
  key: Bytes.Bytes,
  value: Bytes.Bytes,
): void {
  const stem = Bytes.slice(key, 0, 31)
  const subIndex = Bytes.slice(key, 31)[0]!

  if (tree.root.type === 'empty') {
    tree.root = stemNode(stem)
    tree.root.values[subIndex] = value
    return
  }

  function inner(
    n: Node,
    stem: Bytes.Bytes,
    subIndex: number,
    value: Bytes.Bytes,
    depth: number,
  ): Node {
    let node = n

    if (node.type === 'empty') {
      node = stemNode(stem)
      node.values[subIndex!] = value
      return node
    }

    const stem_bits = bytesToBits(stem)
    if (node.type === 'stem') {
      if (Bytes.isEqual(node.stem, stem)) {
        node.values[subIndex!] = value
        return node
      }
      const existingStem_bits = bytesToBits(node.stem)
      return splitLeaf(
        node,
        stem_bits,
        existingStem_bits,
        subIndex,
        value,
        depth,
      )
    }

    if (node.type === 'internal') {
      const bit = stem_bits[depth]
      if (bit === 0) {
        node.left = inner(node.left, stem, subIndex, value, depth + 1)
      } else {
        node.right = inner(node.right, stem, subIndex, value, depth + 1)
      }
      return node
    }

    return emptyNode()
  }
  tree.root = inner(tree.root, stem, subIndex, value, 0)
}

export function merkelize(tree: BinaryStateTree): Bytes.Bytes {
  function inner(node: Node): Bytes.Bytes {
    if (node.type === 'empty') return new Uint8Array(32).fill(0)
    if (node.type === 'internal') {
      const left_hash = inner(node.left)
      const right_hash = inner(node.right)
      return hash(Bytes.concat(left_hash, right_hash))
    }

    let level = node.values.map(hash)
    while (level.length > 1) {
      const new_level = []
      for (let i = 0; i < level.length; i += 2) {
        new_level.push(hash(Bytes.concat(level[i]!, level[i + 1]!)))
      }
      level = new_level
    }

    return hash(Bytes.concat(node.stem, new Uint8Array(1).fill(0), level[0]!))
  }

  return inner(tree.root)
}

//////////////////////////////////////////////////////////////////////////////
// Internal
//////////////////////////////////////////////////////////////////////////////

function splitLeaf(
  leaf: Node,
  stem_bits: number[],
  existingStem_bits: number[],
  subIndex: number,
  value: Bytes.Bytes,
  depth: number,
): Node {
  if (stem_bits[depth] === existingStem_bits[depth]) {
    const new_internal = internalNode()
    const bit = stem_bits[depth]
    if (bit === 0) {
      new_internal.left = splitLeaf(
        leaf,
        stem_bits,
        existingStem_bits,
        subIndex,
        value,
        depth + 1,
      )
    } else {
      new_internal.right = splitLeaf(
        leaf,
        stem_bits,
        existingStem_bits,
        subIndex,
        value,
        depth + 1,
      )
    }
    return new_internal
  }

  const new_internal = internalNode()
  const bit = stem_bits[depth]
  const stem = bitsToBytes(stem_bits)
  if (bit === 0) {
    new_internal.left = stemNode(stem)
    new_internal.left.values[subIndex] = value
    new_internal.right = leaf
  } else {
    new_internal.right = stemNode(stem)
    new_internal.right.values[subIndex] = value
    new_internal.left = leaf
  }
  return new_internal
}

function emptyNode(): EmptyNode {
  return {
    type: 'empty',
  }
}

function internalNode(): InternalNode {
  return {
    left: emptyNode(),
    right: emptyNode(),
    type: 'internal',
  }
}

function stemNode(stem: Bytes.Bytes): StemNode {
  return {
    stem,
    values: Array.from({ length: 256 }, () => undefined),
    type: 'stem',
  }
}

function bytesToBits(bytes: Bytes.Bytes): number[] {
  const bits = []
  for (const byte of bytes)
    for (let i = 0; i < 8; i++) bits.push((byte >> (7 - i)) & 1)
  return bits
}

function bitsToBytes(bits: number[]): Bytes.Bytes {
  const byte_data = new Uint8Array(bits.length / 8)
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte |= bits[i + j]! << (7 - j)
    byte_data[i / 8] = byte
  }
  return byte_data
}

function hash(bytes: Bytes.Bytes | undefined): Bytes.Bytes {
  if (!bytes) return new Uint8Array(32).fill(0)
  if (!bytes.some((byte) => byte !== 0)) return new Uint8Array(32).fill(0)
  return blake3(bytes)
}

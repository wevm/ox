import { blake3 } from '@noble/hashes/blake3.js'

import * as Bytes from './Bytes.js'
import type { OneOf } from './internal/types.js'

/** Type that defines a Binary State Tree instance. */
export type BinaryStateTree = {
  root: Node
}

/** Type defining a node of the BST. */
export type Node = OneOf<EmptyNode | StemNode | InternalNode>

/**
 * Creates a new Binary State Tree instance.
 *
 * @example
 * ```ts twoslash
 * import { BinaryStateTree } from 'ox'
 *
 * const tree = BinaryStateTree.create()
 * ```
 *
 * @returns A Binary State Tree.
 */
export function create(): BinaryStateTree {
  return {
    root: emptyNode(),
  }
}

/**
 * Inserts a key-value pair into the Binary State Tree.
 *
 * @example
 * ```ts twoslash
 * import { BinaryStateTree, Bytes } from 'ox'
 *
 * const tree = BinaryStateTree.create()
 *
 * BinaryStateTree.insert( // [!code focus]
 *   tree, // [!code focus]
 *   Bytes.fromHex('0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'), // [!code focus]
 *   Bytes.fromHex('0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1') // [!code focus]
 * ) // [!code focus]
 * ```
 *
 * @param tree - Binary State Tree instance.
 * @param key - Key to insert.
 * @param value - Value to insert.
 */
export function insert(
  tree: BinaryStateTree,
  key: Bytes.Bytes,
  value: Bytes.Bytes,
): void {
  const stem = Bytes.slice(key, 0, 31)
  const subIndex = Bytes.slice(key, 31)[0]!

  if (tree.root.type === 'empty') {
    tree.root = stemNode(stem)
    tree.root.values.set(subIndex, value)
    return
  }

  function inner(
    node_: Node,
    stem: Bytes.Bytes,
    subIndex: number,
    value: Bytes.Bytes,
    depth: number,
  ): Node {
    let node = node_

    if (node.type === 'empty') {
      node = stemNode(stem)
      node.values.set(subIndex, value)
      return node
    }

    if (node.type === 'stem') {
      if (Bytes.isEqual(node.stem, stem)) {
        node.values.set(subIndex, value)
        return node
      }
      return splitLeaf(node, stem, subIndex, value, depth)
    }

    if (node.type === 'internal') {
      const bit = getBit(stem, depth)
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

/**
 * Merkelizes a Binary State Tree.
 *
 * @example
 * ```ts twoslash
 * import { BinaryStateTree, Bytes } from 'ox'
 *
 * const tree = BinaryStateTree.create()
 *
 * BinaryStateTree.insert(
 *   tree,
 *   Bytes.fromHex('0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54'),
 *   Bytes.fromHex('0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1')
 * )
 *
 * const hash = BinaryStateTree.merkelize(tree) // [!code focus]
 * ```
 *
 * @param tree - Binary State Tree instance.
 * @returns Merkle hash.
 */
export function merkelize(tree: BinaryStateTree): Bytes.Bytes {
  function inner(node: Node): Bytes.Bytes {
    if (node.type === 'empty') return ZERO32
    if (node.type === 'internal') {
      const hash_left = inner(node.left)
      const hash_right = inner(node.right)
      return hash(Bytes.concat(hash_left, hash_right))
    }

    // Reduce a 256-leaf binary tree where any unset slot hashes to ZERO32.
    // Allocate a single 256-entry buffer up-front and iterate in place,
    // halving the active span at each level instead of creating a fresh
    // array per level.
    const level: Bytes.Bytes[] = new Array(256)
    for (let i = 0; i < 256; i++) {
      const v = node.values.get(i)
      level[i] = v ? hash(v) : ZERO32
    }
    let size = 256
    while (size > 1) {
      const half = size >> 1
      for (let i = 0; i < half; i++)
        level[i] = hash(Bytes.concat(level[2 * i]!, level[2 * i + 1]!))
      size = half
    }

    return hash(Bytes.concat(node.stem, ZERO1, level[0]!))
  }

  return inner(tree.root)
}

//////////////////////////////////////////////////////////////////////////////
// Internal
//////////////////////////////////////////////////////////////////////////////

/** @internal */
type EmptyNode = {
  type: 'empty'
}

/** @internal */
type InternalNode = {
  left: Node
  right: Node
  type: 'internal'
}

/** @internal */
type StemNode = {
  stem: Bytes.Bytes
  values: Map<number, Bytes.Bytes>
  type: 'stem'
}

/** @internal */
const ZERO32: Bytes.Bytes = new Uint8Array(32)

/** @internal */
const ZERO1: Bytes.Bytes = new Uint8Array(1)

/** @internal */
function getBit(stem: Bytes.Bytes, depth: number): number {
  return (stem[depth >> 3]! >> (7 - (depth & 7))) & 1
}

/** @internal */
function splitLeaf(
  leaf: StemNode,
  stem: Bytes.Bytes,
  subIndex: number,
  value: Bytes.Bytes,
  depth: number,
): Node {
  const bit = getBit(stem, depth)
  const existingBit = getBit(leaf.stem, depth)
  if (bit === existingBit) {
    const internal = internalNode()
    if (bit === 0) {
      internal.left = splitLeaf(leaf, stem, subIndex, value, depth + 1)
    } else {
      internal.right = splitLeaf(leaf, stem, subIndex, value, depth + 1)
    }
    return internal
  }

  const internal = internalNode()
  if (bit === 0) {
    internal.left = stemNode(stem)
    internal.left.values.set(subIndex, value)
    internal.right = leaf
  } else {
    internal.right = stemNode(stem)
    internal.right.values.set(subIndex, value)
    internal.left = leaf
  }
  return internal
}

/** @internal */
function emptyNode(): EmptyNode {
  return {
    type: 'empty',
  }
}

/** @internal */
function internalNode(): InternalNode {
  return {
    left: emptyNode(),
    right: emptyNode(),
    type: 'internal',
  }
}

/** @internal */
function stemNode(stem: Bytes.Bytes): StemNode {
  return {
    stem,
    values: new Map(),
    type: 'stem',
  }
}

/** @internal */
function hash(bytes: Bytes.Bytes | undefined): Bytes.Bytes {
  if (!bytes) return ZERO32
  if (!bytes.some((byte) => byte !== 0)) return ZERO32
  return blake3(bytes)
}

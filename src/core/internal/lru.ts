/**
 * Map with a bounded FIFO eviction policy. Reads do not reorder entries; only
 * writes touch the eviction queue.
 *
 * @internal
 */
export class BoundedMap<value = unknown> extends Map<string, value> {
  maxSize: number

  constructor(size: number) {
    super()
    this.maxSize = size
  }

  override set(key: string, value: value) {
    if (!super.has(key) && this.maxSize && this.size >= this.maxSize) {
      const firstKey = this.keys().next().value
      if (firstKey !== undefined) this.delete(firstKey)
    }
    return super.set(key, value)
  }
}

/**
 * Cache keyed by object identity. Entries live as long as their key, and
 * `clear` drops them all by swapping in a new `WeakMap`, which has no `clear`
 * of its own.
 *
 * @internal
 */
export function weakCache<key extends object, value>() {
  let map = new WeakMap<key, value>()
  return {
    clear() {
      map = new WeakMap()
    },
    get(key: key) {
      return map.get(key)
    },
    set(key: key, value: value) {
      map.set(key, value)
    },
  }
}

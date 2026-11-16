/**
 * @internal
 *
 * Map with a LRU (Least recently used) policy.
 * @see https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 */
export class LruMap<value = unknown> extends Map<string, value> {
  maxSize: number

  constructor(size: number) {
    super()
    this.maxSize = size
  }

  override get(key: string) {
    const value = super.get(key)
    if (value === undefined) return value
    super.delete(key)
    super.set(key, value)
    return value
  }

  override set(key: string, value: value) {
    // Re-insert so that an existing key becomes the most recently used.
    super.delete(key)
    super.set(key, value)
    if (this.maxSize && this.size > this.maxSize) {
      const firstKey = this.keys().next().value
      if (firstKey !== undefined) this.delete(firstKey)
    }
    return this
  }
}

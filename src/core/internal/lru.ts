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

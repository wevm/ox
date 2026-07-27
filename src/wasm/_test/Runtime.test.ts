import { readFileSync } from 'node:fs'
import { expect, test } from 'vp/test'
import { instantiate } from '../internal/instantiate.js'
import { wasmBase64 } from './runtime.wasm.js'

test('freestanding runtime preserves memmove and realloc semantics', async () => {
  const module = await instantiate<{ run(): number }>(wasmBase64)
  expect(module.exports.run()).toBe(0)
})

test('memmove compares flat-memory offsets rather than C object pointers', () => {
  const source = readFileSync(
    new URL('../../../wasm/src/ox_rt.c', import.meta.url),
    'utf8',
  )
  const body = source.match(/void \*memmove\([\s\S]*?\n}\n\nvoid \*memset/)?.[0]

  expect(body).toBeDefined()
  expect(body).toContain('if ((size_t)d < (size_t)s)')
  expect(body).not.toMatch(/if\s*\(\s*d\s*<\s*s\s*\)/)
})

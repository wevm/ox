/**
 * Differential harness for implementations that must be interchangeable.
 *
 * Several codecs in ox dispatch to whichever implementation the runtime offers
 * -- a native `Uint8Array` method, Node's `Buffer`, or a JavaScript loop. That
 * choice is made once, at import, from feature detection, so a test run only
 * ever exercises the tier its own runtime happens to select. Bugs then live
 * indefinitely in the tiers nobody's CI reaches: both `Hex` and `Base64` shipped
 * the same one, each in a tier the other runtime never ran.
 *
 * The fix is not more runtimes. It is calling the tiers directly, so a single
 * process exercises every implementation it is physically able to run -- Node
 * can execute the loop and `Buffer`, a browser the loop and its native method --
 * and comparing them against each other on the same input.
 *
 * @internal
 */

import { expect } from 'vp/test'

/** One of several implementations that must be interchangeable. */
export type Tier<input, output> = {
  /** Identifies the odd one out when tiers disagree. */
  name: string
  run: (input: input) => output
}

/** What an implementation did with an input: produced a value, or refused it. */
export type Outcome<output> = { ok: true; value: output } | { ok: false }

/**
 * Runs `fn`, reporting whether it produced a value rather than what it threw.
 *
 * Tiers are allowed to disagree on the error they raise -- a native method
 * throws its own `SyntaxError`, ox throws a typed class -- but never on whether
 * the input was acceptable. Error classes are asserted by each codec's own
 * tests, against published vectors.
 *
 * @internal
 */
export function outcome<output>(fn: () => output): Outcome<output> {
  try {
    return { ok: true, value: fn() }
  } catch {
    return { ok: false }
  }
}

/**
 * Asserts every tier reaches the same outcome for every input.
 *
 * Tiers absent from the current runtime are the caller's to filter out, so that
 * coverage widens on its own wherever more of them exist.
 *
 * @internal
 */
export function expectTiersAgree<input, output>(
  tiers: readonly Tier<input, output>[],
  inputs: Iterable<input>,
  options: expectTiersAgree.Options<input> = {},
): void {
  const { describe = (input) => JSON.stringify(input) } = options
  if (tiers.length < 2) return

  const [reference, ...rest] = tiers as [
    Tier<input, output>,
    ...Tier<input, output>[],
  ]
  for (const input of inputs) {
    const expected = outcome(() => reference.run(input))
    for (const tier of rest)
      expect(
        outcome(() => tier.run(input)),
        `${tier.name} disagrees with ${reference.name} on ${describe(input)}`,
      ).toEqual(expected)
  }
}

export declare namespace expectTiersAgree {
  type Options<input> = {
    /** Renders an input for the failure message. Defaults to `JSON.stringify`. */
    describe?: ((input: input) => string) | undefined
  }
}

/**
 * Asserts every tier maps each vector's input to its expected output.
 *
 * Where {@link expectTiersAgree} only proves the tiers match each other, this
 * pins them to values from an outside authority, so they cannot agree on the
 * wrong answer.
 *
 * @internal
 */
export function expectTiersMatch<input, output>(
  tiers: readonly Tier<input, output>[],
  vectors: Iterable<{ input: input; output: output }>,
  options: expectTiersAgree.Options<input> = {},
): void {
  const { describe = (input) => JSON.stringify(input) } = options
  for (const { input, output } of vectors)
    for (const tier of tiers)
      expect(tier.run(input), `${tier.name} on ${describe(input)}`).toEqual(
        output,
      )
}

/**
 * Asserts every tier refuses each input.
 *
 * @internal
 */
export function expectTiersReject<input, output>(
  tiers: readonly Tier<input, output>[],
  inputs: Iterable<input>,
  options: expectTiersAgree.Options<input> = {},
): void {
  const { describe = (input) => JSON.stringify(input) } = options
  for (const input of inputs)
    for (const tier of tiers)
      expect(
        outcome(() => tier.run(input)).ok,
        `${tier.name} accepted ${describe(input)}`,
      ).toBe(false)
}

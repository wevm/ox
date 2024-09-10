import { expect, test } from 'vitest'

import { Siwe_InvalidMessageFieldError } from './errors.js'

test('InvalidMessageFieldError', () => {
  expect(
    new Siwe_InvalidMessageFieldError({
      field: 'nonce',
      metaMessages: [
        '- Nonce must be at least 8 characters.',
        '- Nonce must be alphanumeric.',
        '',
        'Provided value: foobarbaz$',
      ],
    }),
  ).toMatchInlineSnapshot(`
    [Siwe.InvalidMessageFieldError: Invalid Sign-In with Ethereum message field "nonce".

    - Nonce must be at least 8 characters.
    - Nonce must be alphanumeric.

    Provided value: foobarbaz$

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

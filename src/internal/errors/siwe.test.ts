import { expect, test } from 'vitest'

import { SiweInvalidMessageFieldError } from './siwe.js'

test('SiweInvalidMessageFieldError', () => {
  expect(
    new SiweInvalidMessageFieldError({
      field: 'nonce',
      metaMessages: [
        '- Nonce must be at least 8 characters.',
        '- Nonce must be alphanumeric.',
        '',
        'Provided value: foobarbaz$',
      ],
    }),
  ).toMatchInlineSnapshot(`
    [SiweInvalidMessageFieldError: Invalid Sign-In with Ethereum message field "nonce".

    - Nonce must be at least 8 characters.
    - Nonce must be alphanumeric.

    Provided value: foobarbaz$

    See: https://oxlib.sh/errors#siweinvalidmessagefielderror]
  `)
})

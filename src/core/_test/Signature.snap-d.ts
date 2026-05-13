import { attest } from '@ark/attest'
import { Signature } from 'ox'
import { test } from 'vitest'

test('default', () => {
  const signature = Signature.fromParts({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
    yParity: 1,
  })

  attest(signature).type.toString.snap('`0x${string}`')
})

test('behavior: unrecovered', () => {
  const signature = Signature.fromParts<false>({
    r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
    s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  })

  attest(signature).type.toString.snap('`0x${string}`')
})

import { Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.fromCompact({
      r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
      yParityAndS:
        57228803202727131502949358313456071280488184270258293674242124340113824882788n,
    }),
  ).toMatchInlineSnapshot(
    `
    {
      "r": 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
      "s": 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
      "yParity": 0,
    }
  `,
  )

  expect(
    Signature.fromCompact({
      r: 66562167799061955897715466087184286716216901345741287396899365149708368576374n,
      yParityAndS:
        66766372069256663807040028396033823040826002658349008928114625707040337889171n,
    }),
  ).toMatchInlineSnapshot(
    `
    {
      "r": 66562167799061955897715466087184286716216901345741287396899365149708368576374n,
      "s": 8870327450598566095254535891689869114191010325528726908385833703083773069203n,
      "yParity": 1,
    }
  `,
  )
})
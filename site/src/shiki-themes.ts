// Custom Shiki themes aligned with our accent palette.
// Monochromatic: neutral text tones with accent as the highlight color.

const dark = {
  bg: '#14110c', // --bg
  fg: '#f1ebde', // --fg
  dim: '#a39a85', // --fg-dim
  mute: '#6e665a', // --fg-mute
  strong: '#ffffff', // --fg-strong
  accent: '#e85d35', // --accent
}

const light = {
  bg: '#f3ecdb',
  fg: '#1d1a14',
  dim: '#5e564a',
  mute: '#8e8678',
  strong: '#000000',
  accent: '#b8421d',
}

type Palette = typeof dark

function buildTokenColors(p: Palette) {
  return [
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: p.mute, fontStyle: 'italic' },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.logical',
      ],
      settings: { foreground: p.accent },
    },
    {
      scope: ['string', 'string.quoted', 'string.template'],
      settings: { foreground: p.dim },
    },
    {
      scope: [
        'entity.name.function',
        'meta.function-call entity.name.function',
        'support.function',
        'variable.function',
      ],
      settings: { foreground: p.strong },
    },
    {
      scope: [
        'variable.other.property',
        'meta.property.object',
        'meta.object-literal.key',
        'entity.name.tag',
        'support.type.property-name',
      ],
      settings: { foreground: p.fg },
    },
    {
      scope: ['variable', 'variable.other', 'variable.parameter'],
      settings: { foreground: p.fg },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.other'],
      settings: { foreground: p.accent },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
      ],
      settings: { foreground: p.strong },
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'meta.delimiter',
        'punctuation.separator',
      ],
      settings: { foreground: p.mute },
    },
  ]
}

export const shikiDark = {
  name: 'ox-dark',
  type: 'dark',
  colors: {
    'editor.background': dark.bg,
    // Unstyled tokens use a dim tone so highlighted tokens (functions,
    // keywords, etc.) stand out against them.
    'editor.foreground': dark.dim,
  },
  tokenColors: buildTokenColors(dark),
} as const

export const shikiLight = {
  name: 'ox-light',
  type: 'light',
  colors: {
    'editor.background': light.bg,
    'editor.foreground': light.dim,
  },
  tokenColors: buildTokenColors(light),
} as const

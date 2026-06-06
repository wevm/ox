/* @jsxRuntime automatic */
/* @jsxImportSource react */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ImageResponse } from '@takumi-rs/image-response'

// Logical 16:9 canvas, rendered at 2x for crisp output (matches existing asset).
const scale = 2
const width = 1200 * scale
const height = 675 * scale
const s = (n: number) => n * scale

const colors = {
  bg: '#14110c',
  primary: '#f1ebde',
  secondary: '#a39a85',
  muted: '#6e665a',
  accent: '#e85d35',
}

const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (p: string) => readFileSync(new URL(p, import.meta.url))

const geist = read('./fonts/Geist-Variable.woff2')
const instrumentSerif = read('./fonts/InstrumentSerif-Regular.woff2')
const instrumentSerifItalic = read('./fonts/InstrumentSerif-Italic.woff2')
const jetbrainsMono = read('./fonts/JetBrainsMono-Medium.woff2')

const toPngDataUri = (buffer: Buffer) =>
  `data:image/png;base64,${buffer.toString('base64')}`
const patternDataUri = toPngDataUri(read('./pattern.png'))
const logoDataUri = toPngDataUri(
  readFileSync(`${dir}../../public/logo-dark.png`),
)

const element = (
  <div
    style={{
      display: 'flex',
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: colors.bg,
      fontFamily: 'Geist',
      overflow: 'hidden',
    }}
  >
    <img
      src={patternDataUri}
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    />

    {/* Ghost logo watermark, bleeding off the right edge */}
    <img
      src={logoDataUri}
      style={{
        position: 'absolute',
        top: s(80),
        right: s(-160),
        width: s(600),
        height: s(610),
        opacity: 0.05,
      }}
    />

    {/* Brand badge */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: s(18),
        position: 'absolute',
        top: s(64),
        left: s(80),
      }}
    >
      <img src={logoDataUri} style={{ width: s(52), height: s(52) }} />
      <div
        style={{ display: 'flex', fontSize: s(28), color: colors.secondary }}
      >
        <span style={{ marginRight: s(10) }}>by</span>
        <span style={{ color: colors.primary, fontWeight: 600 }}>Wevm</span>
      </div>
    </div>

    {/* Content */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: `0 ${s(80)}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Instrument Serif',
          fontSize: s(88),
          lineHeight: 0.98,
          letterSpacing: '-0.02em',
          color: colors.primary,
        }}
      >
        <div style={{ display: 'flex' }}>EVM Standard Library,</div>
        <div
          style={{ display: 'flex', fontStyle: 'italic', color: colors.accent }}
        >
          for Agents &amp; Humans.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: s(28),
          fontSize: s(28),
          lineHeight: 1.45,
          color: colors.secondary,
          maxWidth: s(740),
        }}
      >
        Composable, type-safe primitives for agents and developers shipping EVM
        software. The foundation that Viem, Wagmi, and your stack are built on.
      </div>

      {/* Install command */}
      <div
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          marginTop: s(44),
          padding: `${s(22)}px ${s(40)}px`,
          backgroundColor: '#1c1813',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: '#3a342b',
          fontFamily: 'JetBrains Mono',
          fontSize: s(34),
        }}
      >
        <span style={{ color: colors.muted, marginRight: s(16) }}>npm</span>
        <span style={{ color: colors.muted, marginRight: s(16) }}>i</span>
        <span style={{ color: colors.accent }}>ox</span>
      </div>
    </div>
  </div>
)

const response = new ImageResponse(element, {
  width,
  height,
  format: 'png',
  fonts: [
    { name: 'Geist', data: geist, weight: 400, style: 'normal' },
    { name: 'Geist', data: geist, weight: 600, style: 'normal' },
    {
      name: 'Instrument Serif',
      data: instrumentSerif,
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Instrument Serif',
      data: instrumentSerifItalic,
      weight: 400,
      style: 'italic',
    },
    {
      name: 'JetBrains Mono',
      data: jetbrainsMono,
      weight: 500,
      style: 'normal',
    },
  ],
})

const buffer = Buffer.from(await response.arrayBuffer())
writeFileSync(`${dir}../../public/og-image.png`, buffer)
console.log(`Wrote og-image.png (${width}x${height}, ${buffer.length} bytes)`)

import diagnosticsChannel from 'node:diagnostics_channel'

const hostname = 'api.cloudflare.com'
const origin = `https://${hostname}`
const requests = new WeakMap()

let id = 0

diagnosticsChannel.subscribe('undici:request:create', ({ request }) => {
  try {
    if (new URL(request.origin).origin !== origin) return

    const path = redactPath(request.path)
    if (!path) return

    const metadata = {
      id: ++id,
      method: request.method,
      path,
      stage: stage(request.method, path),
      startedAt: Date.now(),
    }
    requests.set(request, metadata)
    console.log(
      `[cloudflare:${metadata.id}] request ${metadata.stage} ${metadata.method} ${metadata.path}`,
    )
  } catch {}
})

diagnosticsChannel.subscribe(
  'undici:request:headers',
  ({ request, response }) => {
    try {
      const metadata = requests.get(request)
      if (!metadata) return

      const ray = header(response.headers, 'cf-ray')
      console.log(
        `[cloudflare:${metadata.id}] response ${metadata.stage} ${response.statusCode} ${metadata.method} ${metadata.path} (${elapsed(metadata.startedAt)}${ray ? `, cf-ray ${ray}` : ''})`,
      )
    } catch {}
  },
)

diagnosticsChannel.subscribe('undici:request:error', ({ error, request }) => {
  try {
    const metadata = requests.get(request)
    if (!metadata) return

    console.log(
      `[cloudflare:${metadata.id}] error ${metadata.stage} ${metadata.method} ${metadata.path} (${elapsed(metadata.startedAt)}): ${formatError(error)}`,
    )
    requests.delete(request)
  } catch {}
})

diagnosticsChannel.subscribe('undici:request:trailers', ({ request }) => {
  requests.delete(request)
})

diagnosticsChannel.subscribe(
  'undici:client:connected',
  ({ connectParams, socket }) => {
    try {
      if (connectParams.hostname !== hostname) return
      console.log(
        `[cloudflare] connected ${socket.remoteAddress}:${socket.remotePort} (${socket.remoteFamily})`,
      )
    } catch {}
  },
)

diagnosticsChannel.subscribe(
  'undici:client:connectError',
  ({ connectParams, error }) => {
    try {
      if (connectParams.hostname !== hostname) return
      console.log(
        `[cloudflare] connection error ${hostname}:${connectParams.port}: ${formatError(error)}`,
      )
    } catch {}
  },
)

function elapsed(startedAt) {
  return `${((Date.now() - startedAt) / 1_000).toFixed(2)}s`
}

function formatError(error) {
  if (!(error instanceof Error)) return redact(String(error))

  const code =
    'code' in error && typeof error.code === 'string' ? `${error.code}: ` : ''
  const causes =
    error instanceof AggregateError
      ? ` (${error.errors.map(formatError).join('; ')})`
      : ''
  return redact(`${code}${error.message}${causes}`)
}

function header(headers, name) {
  for (let index = 0; index < headers.length; index += 2)
    if (headers[index]?.toString().toLowerCase() === name)
      return headers[index + 1]?.toString()
  return undefined
}

function redactPath(path) {
  const pathname = new URL(path, origin).pathname
  if (
    !/^\/client\/v4\/accounts\/[^/]+\/(?:ai\/run\/|vectorize\/v2\/indexes(?:\/|$))/.test(
      pathname,
    )
  )
    return undefined
  return pathname.replace(/\/accounts\/[^/]+/, '/accounts/:account')
}

function redact(value) {
  let output = value
  for (const secret of [
    process.env.CLOUDFLARE_ACCOUNT_ID,
    process.env.CLOUDFLARE_API_TOKEN,
  ])
    if (secret) output = output.replaceAll(secret, '[redacted]')
  return output
    .replaceAll(/\/accounts\/[^/\s?]+/g, '/accounts/:account')
    .replaceAll(/Bearer\s+\S+/gi, 'Bearer [redacted]')
}

function stage(method, path) {
  if (path.includes('/ai/run/'))
    return path.includes('reranker') ? 'reranker' : 'embedding'

  const suffix = path.split('/vectorize/v2/indexes')[1]
  if (suffix === '')
    return method === 'POST' ? 'vectorize.create-index' : 'vectorize'
  if (suffix?.endsWith('/list')) return 'vectorize.list'
  if (suffix?.endsWith('/upsert')) return 'vectorize.upsert'
  if (suffix?.endsWith('/delete_by_ids')) return 'vectorize.delete'
  if (suffix?.endsWith('/query')) return 'vectorize.query'
  if (method === 'GET') return 'vectorize.ensure-index'
  return 'vectorize'
}

import { BaseError } from '../Errors/base.js'
import { getUrl } from '../Errors/utils.js'

export class RpcTransport_HttpError extends BaseError {
  override readonly name = 'RpcTransport.HttpError'

  constructor({
    body,
    details,
    response,
    url,
  }: { body: unknown; details: string; response: Response; url: string }) {
    super('HTTP request failed.', {
      details,
      metaMessages: [
        `Status: ${response.status}`,
        `URL: ${getUrl(url)}`,
        body ? `Body: ${JSON.stringify(body)}` : undefined,
      ],
    })
  }
}

export class RpcTransport_MalformedResponseError extends BaseError {
  override readonly name = 'RpcTransport.MalformedResponseError'

  constructor({ response }: { response: string }) {
    super('HTTP Response could not be parsed as JSON.', {
      metaMessages: [`Response: ${response}`],
    })
  }
}

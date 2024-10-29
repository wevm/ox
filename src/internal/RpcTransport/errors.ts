import * as Errors from '../../Errors.js'
import { getUrl } from '../Errors/utils.js'

/** Thrown when a HTTP request fails. */
export class RpcTransport_HttpError extends Errors.BaseError {
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

/** Thrown when a HTTP response is malformed. */
export class RpcTransport_MalformedResponseError extends Errors.BaseError {
  override readonly name = 'RpcTransport.MalformedResponseError'

  constructor({ response }: { response: string }) {
    super('HTTP Response could not be parsed as JSON.', {
      metaMessages: [`Response: ${response}`],
    })
  }
}

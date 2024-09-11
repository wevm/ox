import { EventEmitter } from 'eventemitter3'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Provider_Emitter, Provider_EventMap } from './types.js'

export function Provider_createEmitter(): Provider_Emitter {
  const emitter = new EventEmitter<Provider_EventMap>()

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter)
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter)
    },
    get listeners() {
      return emitter.listeners.bind(emitter)
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  }
}

export declare namespace Provider_createEmitter {
  type ErrorType = GlobalErrorType
}

Provider_createEmitter.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Provider_createEmitter.ErrorType

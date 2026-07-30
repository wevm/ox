import { Engine } from 'ox'
import { Engine as NodeEngine } from 'ox/node'
import { register } from '../../test/benchmarks/comparison.js'
import { createOperations } from '../../test/benchmarks/comparison.current.js'

Engine.reset()
Engine.set(await NodeEngine.engine())
register('ox/node', createOperations())

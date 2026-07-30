import { Engine } from 'ox'
import { register } from '../../test/benchmarks/comparison.js'
import { createOperations } from '../../test/benchmarks/comparison.current.js'

Engine.reset()
register('ox', createOperations())

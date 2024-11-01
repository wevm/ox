import { generateAbiVectors } from './src/abi.js'
import { generateRlpVectors } from './src/rlp.js'

await generateAbiVectors()
await generateRlpVectors()

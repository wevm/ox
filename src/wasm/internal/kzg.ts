import {
  compile,
  instantiateModule,
  memoize,
  type Module,
} from './instantiate.js'
import { wasmBase64 } from './kzg.wasm.js'

/** Exports supplied by the dedicated c-kzg artifact. @internal */
export type Exports = {
  alloc(size: number): number
  dealloc(ptr: number): void
  kzg_blob_to_kzg_commitment(out: number, blob: number): number
  kzg_compute_cells(cells: number, blob: number): number
  kzg_compute_cells_and_kzg_proofs(
    cells: number,
    proofs: number,
    blob: number,
  ): number
  kzg_dispose(): void
  kzg_initialize(
    g1Monomial: number,
    g1Lagrange: number,
    g2Monomial: number,
    precompute: number,
  ): number
  kzg_recover_cells_and_kzg_proofs(
    recoveredCells: number,
    recoveredProofs: number,
    cellIndices: number,
    cells: number,
    count: number,
  ): number
  kzg_verify_cell_kzg_proof_batch(
    verified: number,
    commitments: number,
    cellIndices: number,
    cells: number,
    proofs: number,
    count: number,
  ): number
  zero(ptr: number, length: number): void
}

const load = memoize(() => compile(wasmBase64))

/** Instantiates an independently owned c-kzg module. @internal */
export async function instantiate(): Promise<Module<Exports>> {
  return instantiateModule(await load())
}

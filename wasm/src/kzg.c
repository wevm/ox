#include "ckzg.h"

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

static KZGSettings settings;
static bool initialized = false;

__attribute__((export_name("kzg_initialize"))) uint32_t kzg_initialize(
    const uint8_t *g1_monomial,
    const uint8_t *g1_lagrange,
    const uint8_t *g2_monomial,
    uint32_t precompute
) {
    if (initialized) return C_KZG_BADARGS;

    C_KZG_RET ret = load_trusted_setup(
        &settings,
        g1_monomial,
        4096 * 48,
        g1_lagrange,
        4096 * 48,
        g2_monomial,
        65 * 96,
        precompute
    );
    if (ret == C_KZG_OK) initialized = true;
    return ret;
}

__attribute__((export_name("kzg_dispose"))) void kzg_dispose(void) {
    if (!initialized) return;
    free_trusted_setup(&settings);
    initialized = false;
}

__attribute__((export_name("kzg_blob_to_kzg_commitment"))) uint32_t
kzg_blob_to_kzg_commitment(uint8_t *out, const uint8_t *blob) {
    if (!initialized) return C_KZG_BADARGS;
    return blob_to_kzg_commitment(
        (KZGCommitment *)out, (const Blob *)blob, &settings
    );
}

__attribute__((export_name("kzg_compute_cells"))) uint32_t kzg_compute_cells(
    uint8_t *cells,
    const uint8_t *blob
) {
    if (!initialized) return C_KZG_BADARGS;
    return compute_cells_and_kzg_proofs(
        (Cell *)cells, NULL, (const Blob *)blob, &settings
    );
}

__attribute__((export_name("kzg_compute_cells_and_kzg_proofs"))) uint32_t
kzg_compute_cells_and_kzg_proofs(
    uint8_t *cells,
    uint8_t *proofs,
    const uint8_t *blob
) {
    if (!initialized) return C_KZG_BADARGS;
    return compute_cells_and_kzg_proofs(
        (Cell *)cells,
        (KZGProof *)proofs,
        (const Blob *)blob,
        &settings
    );
}

__attribute__((export_name("kzg_recover_cells_and_kzg_proofs"))) uint32_t
kzg_recover_cells_and_kzg_proofs(
    uint8_t *recovered_cells,
    uint8_t *recovered_proofs,
    const uint64_t *cell_indices,
    const uint8_t *cells,
    uint32_t num_cells
) {
    if (!initialized) return C_KZG_BADARGS;
    return recover_cells_and_kzg_proofs(
        (Cell *)recovered_cells,
        (KZGProof *)recovered_proofs,
        cell_indices,
        (const Cell *)cells,
        num_cells,
        &settings
    );
}

__attribute__((export_name("kzg_verify_cell_kzg_proof_batch"))) uint32_t
kzg_verify_cell_kzg_proof_batch(
    uint32_t *verified,
    const uint8_t *commitments,
    const uint64_t *cell_indices,
    const uint8_t *cells,
    const uint8_t *proofs,
    uint32_t num_cells
) {
    bool result = false;
    if (!initialized) return C_KZG_BADARGS;

    C_KZG_RET ret = verify_cell_kzg_proof_batch(
        &result,
        (const Bytes48 *)commitments,
        cell_indices,
        (const Cell *)cells,
        (const Bytes48 *)proofs,
        num_cells,
        &settings
    );
    *verified = result;
    return ret;
}

//! evm2's feature flags, addressed by declaration order.
//!
//! `EvmFeatures` keeps its bitmap private and exposes each flag as an associated
//! constant, so the ABI carries an index into this list rather than raw bits. The
//! list is exhaustive: an index outside it is rejected, which makes a flag added
//! upstream a visible gap instead of a bit that crosses unnoticed.

use evm2::version::EvmFeatures;

/// Every flag evm2 declares, in its own declaration order.
///
/// The position is the wire index, so entries are never reordered or removed.
pub const ALL: &[EvmFeatures] = &[
    EvmFeatures::TX_CHAIN_ID_CHECK,
    EvmFeatures::NONCE_CHECK,
    EvmFeatures::BALANCE_CHECK,
    EvmFeatures::BALANCE_TOP_UP,
    EvmFeatures::BLOCK_GAS_LIMIT_CHECK,
    EvmFeatures::EIP3607,
    EvmFeatures::PRIORITY_FEE_CHECK,
    EvmFeatures::FEE_CHARGE,
    EvmFeatures::EIP2,
    EvmFeatures::EIP150,
    EvmFeatures::EIP161,
    EvmFeatures::CODE_SIZE_CHECK,
    EvmFeatures::EIP2028,
    EvmFeatures::EIP2200,
    EvmFeatures::EIP2929,
    EvmFeatures::EIP3529,
    EvmFeatures::EIP3541,
    EvmFeatures::BASE_FEE_CHECK,
    EvmFeatures::EIP4399,
    EvmFeatures::EIP3651,
    EvmFeatures::EIP3860,
    EvmFeatures::EIP6780,
    EvmFeatures::EIP7623,
    EvmFeatures::EIP7702,
    EvmFeatures::EIP8037,
    EvmFeatures::EIP7708,
    EvmFeatures::EIP8246,
    EvmFeatures::EIP2780,
];

/// Returns the flag at `index`, or `None` when this build does not know it.
pub fn from_index(index: u32) -> Option<EvmFeatures> {
    ALL.get(index as usize).copied()
}

#[cfg(test)]
mod tests {
    use super::*;
    use evm2::{SpecId, version::Version};

    #[test]
    fn every_flag_is_distinct() {
        // A copy-paste duplicate would silently alias two wire indices.
        for (index, flag) in ALL.iter().enumerate() {
            for (other, second) in ALL.iter().enumerate() {
                if index != other {
                    assert_ne!(flag, second, "index {index} duplicates {other}");
                }
            }
        }
    }

    #[test]
    fn the_list_covers_every_flag_amsterdam_enables() {
        // Amsterdam turns on everything evm2 currently declares, so a flag added
        // upstream shows up here as a bit no index accounts for.
        let features = Version::new(SpecId::AMSTERDAM).features;
        let mut rebuilt = EvmFeatures::empty();
        for flag in ALL {
            if features.contains(*flag) {
                rebuilt.insert(*flag);
            }
        }
        assert_eq!(features, rebuilt, "ALL is missing a flag Amsterdam enables");
    }

    #[test]
    fn round_trips_every_specification() {
        for index in 0..=SpecId::AMSTERDAM as u32 {
            let Some(spec) = SpecId::try_from_u32(index) else { continue };
            let features = Version::new(spec).features;
            let mut rebuilt = EvmFeatures::empty();
            for (position, flag) in ALL.iter().enumerate() {
                if features.contains(*flag) {
                    assert!(from_index(position as u32).is_some());
                    rebuilt.insert(*flag);
                }
            }
            assert_eq!(features, rebuilt, "{spec:?} did not round-trip");
        }
    }
}

module open_corner::usdo_faucet;

use open_corner::markets::ProtocolAdminCap;
use open_corner::usdo::USDO;
use sui::coin::{Self, TreasuryCap};
use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};
use sui::transfer;

const E_ZERO_AMOUNT: u64 = 0;
const E_AMOUNT_TOO_LARGE: u64 = 1;
const E_INVALID_LIMIT: u64 = 2;

/// Shared faucet that holds TreasuryCap<USDO> and allows anyone to mint
/// a limited amount of USDO for demo/testing purposes.
public struct UsdoFaucet has key {
    id: UID,
    treasury_cap: TreasuryCap<USDO>,
    max_per_call: u64,
}

/// Create and share a USDO faucet. Requires ProtocolAdminCap so only protocol
/// maintainers can deploy faucets. The faucet stores the provided TreasuryCap
/// and lets any user claim up to `max_per_call` base units per transaction.
public entry fun create_usdo_faucet(
    _admin_cap: &ProtocolAdminCap,
    treasury_cap: TreasuryCap<USDO>,
    max_per_call: u64,
    ctx: &mut TxContext,
) {
    assert!(max_per_call > 0, E_INVALID_LIMIT);

    let faucet = UsdoFaucet {
        id: object::new(ctx),
        treasury_cap,
        max_per_call,
    };

    transfer::share_object(faucet);
}

/// Update the per-call limit. Restricted to protocol admins.
public entry fun update_usdo_faucet_limit(
    _admin_cap: &ProtocolAdminCap,
    faucet: &mut UsdoFaucet,
    new_limit: u64,
) {
    assert!(new_limit > 0, E_INVALID_LIMIT);
    faucet.max_per_call = new_limit;
}

/// Claim freshly minted USDO from the faucet. Anyone can call this while the
/// faucet is shared, but each call is capped by `max_per_call`.
public entry fun claim(
    faucet: &mut UsdoFaucet,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert!(amount <= faucet.max_per_call, E_AMOUNT_TOO_LARGE);

    let usdo = coin::mint<USDO>(&mut faucet.treasury_cap, amount, ctx);
    transfer::public_transfer(usdo, tx_context::sender(ctx));
}

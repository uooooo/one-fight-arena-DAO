module open_corner::fighters;

use sui::event;
use sui::object::{Self, ID, UID};
use std::option::{Self, Option};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// Fighter profile information stored on-chain
public struct FighterProfile has key {
    id: UID,
    /// Fighter's name (hash of full name for privacy)
    name_hash: vector<u8>,
    /// Fighter's social media links (hash)
    socials_hash: vector<u8>,
    /// Reference to the fighter's support vault
    vault_cap: Option<ID>,
}

/// Capability for managing a fighter profile
public struct FighterManagerCap has key {
    id: UID,
    fighter_id: ID,
}

/// Event emitted when a fighter profile is created
public struct FighterCreated has copy, drop {
    fighter_id: ID,
    name_hash: vector<u8>,
}

/// Create a new fighter profile
/// Returns the fighter ID and transfers the manager cap to the caller
public fun create_fighter(
    name_hash: vector<u8>,
    socials_hash: vector<u8>,
    ctx: &mut TxContext,
): ID {
    let fighter = FighterProfile {
        id: object::new(ctx),
        name_hash,
        socials_hash,
        vault_cap: option::none(),
    };

    let fighter_id = object::id(&fighter);
    let cap = FighterManagerCap {
        id: object::new(ctx),
        fighter_id,
    };

    transfer::share_object(fighter);
    transfer::transfer(cap, tx_context::sender(ctx));

    event::emit(FighterCreated {
        fighter_id,
        name_hash,
    });

    fighter_id
}

/// Update fighter's vault reference
public fun set_vault_cap(
    fighter: &mut FighterProfile,
    cap: &FighterManagerCap,
    vault_id: ID,
) {
    assert!(object::id(fighter) == cap.fighter_id, 0);
    fighter.vault_cap = option::some(vault_id);
}

#[test_only]
public fun create_test_fighter(
    ctx: &mut TxContext,
): ID {
    create_fighter(
        b"test_fighter",
        b"test_socials",
        ctx,
    )
}


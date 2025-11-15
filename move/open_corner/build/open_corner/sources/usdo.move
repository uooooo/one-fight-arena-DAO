module open_corner::usdo;

use sui::coin::{Self, TreasuryCap};
use sui::coin_registry;
use sui::transfer;
use sui::tx_context::TxContext;
use std::string;

/// USDO (USDOne) token - Base currency for prediction markets
/// Used for trading YES/NO coins in CPMM pools
public struct USDO has drop {}

/// Initialize USDO coin using One-Time Witness pattern
/// This function is called automatically when the package is published
/// The TreasuryCap is transferred to the package publisher
fun init(otw: USDO, ctx: &mut TxContext) {
    // Create currency using One-Time Witness
    // Note: Returns (CurrencyInitializer, TreasuryCap) in this order
    let (initializer, treasury) = coin_registry::new_currency_with_otw<USDO>(
        otw,
        9, // decimals
        string::utf8(b"USDO"), // symbol
        string::utf8(b"USDOne Token"), // name
        string::utf8(b"USDOne token - Base currency for ONE Fight Arena prediction markets"), // description
        string::utf8(b""), // icon_url (empty string for no icon)
        ctx,
    );
    
    // Finalize the currency registration
    let metadata_cap = coin_registry::finalize(initializer, ctx);
    
    // Transfer TreasuryCap to the package publisher
    transfer::public_transfer(treasury, tx_context::sender(ctx));
    
    // Transfer MetadataCap to the package publisher (for future metadata updates)
    transfer::public_transfer(metadata_cap, tx_context::sender(ctx));
}

/// Create USDO coin (deprecated - use init function instead)
/// This function is kept for backward compatibility but should not be used
/// The coin is now created automatically via init function
public fun create_usdo_coin(
    witness: USDO,
    ctx: &mut TxContext,
): TreasuryCap<USDO> {
    let (treasury, metadata) = coin::create_currency<USDO>(
        witness,
        9, // decimals
        b"USDO", // symbol
        b"USDOne Token", // name
        b"USDOne token - Base currency for ONE Fight Arena prediction markets", // description
        option::none(), // icon_url
        ctx,
    );

    transfer::public_freeze_object(metadata);
    treasury
}


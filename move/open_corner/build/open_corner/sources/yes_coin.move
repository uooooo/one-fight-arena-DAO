module open_corner::yes_coin;

use sui::coin::{Self, TreasuryCap};
use sui::coin_registry;
use sui::transfer;
use sui::tx_context::TxContext;
use std::string;

/// YES coin for prediction markets
/// Each market creates its own YES/NO coin pair
public struct YES_COIN has drop {}

/// Initialize YES coin using One-Time Witness pattern
/// This function is called automatically when the package is published
/// The TreasuryCap is transferred to the package publisher
fun init(otw: YES_COIN, ctx: &mut TxContext) {
    // Create currency using One-Time Witness
    // Note: Returns (CurrencyInitializer, TreasuryCap) in this order
    let (initializer, treasury) = coin_registry::new_currency_with_otw<YES_COIN>(
        otw,
        9, // decimals
        string::utf8(b"YES"), // symbol
        string::utf8(b"YES Coin for Prediction Market"), // name
        string::utf8(b"YES coin for prediction market outcomes"), // description
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

/// Create YES coin for a market (deprecated - use init function instead)
/// This function is kept for backward compatibility but should not be used
/// The coin is now created automatically via init function
public fun create_yes_coin(
    witness: YES_COIN,
    ctx: &mut TxContext,
): TreasuryCap<YES_COIN> {
    let (treasury, metadata) = coin::create_currency<YES_COIN>(
        witness,
        9, // decimals
        b"YES", // symbol
        b"YES Coin for Prediction Market", // name
        b"YES coin for prediction market outcomes", // description
        option::none(), // icon_url
        ctx,
    );

    transfer::public_freeze_object(metadata);
    treasury
}


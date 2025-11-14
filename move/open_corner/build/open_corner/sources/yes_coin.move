module open_corner::yes_coin;

use sui::coin::{Self, TreasuryCap};
use sui::transfer;
use sui::tx_context::TxContext;

/// YES coin for prediction markets
/// Each market creates its own YES/NO coin pair
public struct YES_COIN has drop {}

/// Create YES coin for a market
/// This should be called once per market using One-Time Witness pattern
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


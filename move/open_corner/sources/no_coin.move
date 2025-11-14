module open_corner::no_coin;

use sui::coin::{Self, TreasuryCap};
use sui::transfer;
use sui::tx_context::TxContext;

/// NO coin for prediction markets
/// Each market creates its own YES/NO coin pair
public struct NO_COIN has drop {}

/// Create NO coin for a market
/// This should be called once per market using One-Time Witness pattern
public fun create_no_coin(
    witness: NO_COIN,
    ctx: &mut TxContext,
): TreasuryCap<NO_COIN> {
    let (treasury, metadata) = coin::create_currency<NO_COIN>(
        witness,
        9, // decimals
        b"NO", // symbol
        b"NO Coin for Prediction Market", // name
        b"NO coin for prediction market outcomes", // description
        option::none(), // icon_url
        ctx,
    );

    transfer::public_freeze_object(metadata);
    treasury
}


module open_corner::markets;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use sui::object::{Self, ID, UID};
use std::option::{Self, Option};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use open_corner::yes_coin::{Self, YES_COIN};
use open_corner::no_coin::{Self, NO_COIN};

/// Market states
const OPEN: u8 = 0;
const RESOLVED: u8 = 1;

/// Market for a prediction event
public struct Market has key {
    id: UID,
    event_id: ID,
    question: vector<u8>,
    state: u8,
    /// Type name of the winning coin (YES_COIN or NO_COIN)
    winning_coin_type: Option<vector<u8>>,
    fee_bps: u64, // fee in basis points (e.g., 500 = 5%)
    vault_address: address, // Address of the support vault
}

/// Position NFT representing a bet
public struct PositionNFT has key, store {
    id: UID,
    market_id: ID,
    coin_type: vector<u8>, // Type name as string
    amount: u64,
}

/// Admin capability for creating and resolving markets
public struct ProtocolAdminCap has key {
    id: UID,
}

/// Event emitted when a market is created
public struct MarketCreated has copy, drop {
    market_id: ID,
    event_id: ID,
    question: vector<u8>,
}

/// Event emitted when a market is resolved
public struct MarketResolved has copy, drop {
    market_id: ID,
    result: bool, // true = YES wins, false = NO wins
}

/// Event emitted when a position is redeemed
public struct PayoutClaimed has copy, drop {
    market_id: ID,
    position_id: ID,
    amount: u64,
    claimer: address,
}

/// Create a new prediction market
/// Returns the market ID
public fun create_market(
    admin_cap: &ProtocolAdminCap,
    event_id: ID,
    question: vector<u8>,
    fee_bps: u64,
    vault_address: address,
    ctx: &mut TxContext,
): ID {
    let market = Market {
        id: object::new(ctx),
        event_id,
        question: *&question,
        state: OPEN,
        winning_coin_type: option::none(),
        fee_bps,
        vault_address,
    };

    let market_id = object::id(&market);
    transfer::share_object(market);

    event::emit(MarketCreated {
        market_id,
        event_id,
        question,
    });

    market_id
}

/// Resolve a market (admin only)
public fun resolve_market(
    market: &mut Market,
    admin_cap: &ProtocolAdminCap,
    result: bool, // true = YES wins, false = NO wins
) {
    assert!(market.state == OPEN, 0);

    market.state = RESOLVED;

    if (result) {
        market.winning_coin_type = option::some(b"YES_COIN");
    } else {
        market.winning_coin_type = option::some(b"NO_COIN");
    };

    event::emit(MarketResolved {
        market_id: object::id(market),
        result,
    });
}

/// Redeem winning coins for SUI (1:1 exchange)
/// Note: This is a simplified version. In production, proper SUI pool management is needed.
/// For MVP, this function burns winning coins and emits an event.
/// Actual SUI distribution would need a treasury or DeepBook integration.
public fun redeem_winning_coin<WinningCoinType>(
    market: &Market,
    mut winning_coins: Coin<WinningCoinType>,
    ctx: &mut TxContext,
) {
    assert!(market.state == RESOLVED, 0);
    
    // For MVP, we simplify the coin type check
    // In production, would use proper type checking
    let coin_value = coin::value(&winning_coins);

    // Calculate fee (e.g., 5% = 500 bps)
    let fee = (coin_value * market.fee_bps) / 10000;
    
    // Split coins: fee and remaining
    let fee_coin = coin::split(&mut winning_coins, fee, ctx);
    let remaining_coin = winning_coins;

    // Remaining amount to exchange (1:1 with SUI)
    let sui_amount = coin::value(&remaining_coin);

    // Burn the remaining winning coins
    // For MVP, we use a simplified burn approach
    // Note: In production, proper coin burning would be handled via TreasuryCap
    // For now, we transfer the balance to a zero address (simplified for MVP)
    let remaining_balance = coin::into_balance(remaining_coin);
    transfer::public_transfer(coin::from_balance(remaining_balance, ctx), @0x0);

    // TODO: In production, implement proper SUI pool management
    // For MVP, we'll need to handle this differently - either:
    // 1. Use a treasury that holds SUI for redemptions
    // 2. Integrate with DeepBook for proper exchange
    // For now, we burn the coins and emit an event
    // The actual SUI distribution would happen off-chain or via a separate treasury function

    // Transfer fee to vault (simplified for MVP)
    transfer::public_transfer(fee_coin, market.vault_address);

    event::emit(PayoutClaimed {
        market_id: object::id(market),
        position_id: object::id_from_address(tx_context::sender(ctx)),
        amount: sui_amount,
        claimer: tx_context::sender(ctx),
    });
}

/// Create position NFT (called when user places a bet)
/// The NFT is transferred to the caller
public fun create_position(
    market_id: ID,
    coin_type_name: vector<u8>,
    amount: u64,
    ctx: &mut TxContext,
) {
    let position = PositionNFT {
        id: object::new(ctx),
        market_id,
        coin_type: coin_type_name,
        amount,
    };
    
    transfer::transfer(position, tx_context::sender(ctx));
}

#[test_only]
public fun create_test_market(
    admin_cap: &ProtocolAdminCap,
    event_id: ID,
    ctx: &mut TxContext,
): ID {
    create_market(
        admin_cap,
        event_id,
        b"Test Market",
        500, // 5% fee
        @0x0, // vault address
        ctx,
    )
}


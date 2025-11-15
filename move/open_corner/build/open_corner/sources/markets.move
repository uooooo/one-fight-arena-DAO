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
use open_corner::market_pool::{Self, MarketPool, MarketYes, MarketNo};
use open_corner::usdo::USDO;

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
    /// Pool ID for CPMM trading (MarketPool)
    pool_id: ID,
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

/// Initialize the protocol and create the admin capability
/// This function is called automatically when the package is published
/// The admin capability is transferred to the package publisher
fun init(ctx: &mut TxContext) {
    let admin_cap = ProtocolAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, tx_context::sender(ctx));
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

/// Errors
const E_MARKET_NOT_OPEN: u64 = 0;
const E_MARKET_NOT_RESOLVED: u64 = 1;
const E_INVALID_STATE: u64 = 2;

/// Create a new prediction market
/// Creates both Market and MarketPool
/// TreasuryCaps are stored in MarketPool for public access
/// Returns the market ID
public fun create_market(
    admin_cap: &ProtocolAdminCap,
    event_id: ID,
    question: vector<u8>,
    fee_bps: u64,
    vault_address: address,
    treasury_cap_yes: TreasuryCap<YES_COIN>,
    treasury_cap_no: TreasuryCap<NO_COIN>,
    ctx: &mut TxContext,
): ID {
    // Create Market ID first by creating a temporary object
    // We'll create the market with a temporary pool_id and update it
    let market_id_uid = object::new(ctx);
    let market_id = market_id_uid.to_inner(); // Convert UID to ID
    
    // Create MarketPool for CPMM trading (using market_id and TreasuryCaps)
    // TreasuryCaps are stored in the pool for public access
    let pool_id = market_pool::init_market_pool(market_id, treasury_cap_yes, treasury_cap_no, ctx);
    
    // Create Market with the actual pool_id
    let market = Market {
        id: market_id_uid,
        event_id,
        question: *&question,
        state: OPEN,
        winning_coin_type: option::none(),
        fee_bps,
        vault_address,
        pool_id,
    };
    
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

/// Check if market is in OPEN state
public fun is_open(market: &Market): bool {
    market.state == OPEN
}

/// Check if market is in RESOLVED state
public fun is_resolved(market: &Market): bool {
    market.state == RESOLVED
}

/// Get pool ID for a market
public fun get_pool_id(market: &Market): ID {
    market.pool_id
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

// ===== CPMM MarketPool Integration Functions =====
// Entry functions that wrap market_pool functions with state checks

/// Split USDO into YES/NO pair (with market state check)
/// Only callable when market is OPEN
/// TreasuryCaps are stored in MarketPool, so no need to pass them as arguments
public entry fun split_usdo_for_market(
    market: &Market,
    pool: &mut MarketPool,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
) {
    // Verify market is OPEN
    assert!(market.state == OPEN, E_MARKET_NOT_OPEN);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    
    // Call market_pool::split_usdo (TreasuryCaps are stored in the pool)
    let (market_yes, market_no, yes_coin, no_coin) = market_pool::split_usdo(
        pool,
        usdo_coin,
        ctx,
    );
    
    // Transfer results to tx sender
    transfer::public_transfer(market_yes, tx_context::sender(ctx));
    transfer::public_transfer(market_no, tx_context::sender(ctx));
    transfer::public_transfer(yes_coin, tx_context::sender(ctx));
    transfer::public_transfer(no_coin, tx_context::sender(ctx));
}

/// Join YES/NO pair back into USDO (with market state check)
/// Only callable when market is OPEN
/// TreasuryCaps are stored in MarketPool, so no need to pass them as arguments
public entry fun join_coins_for_market(
    market: &Market,
    pool: &mut MarketPool,
    market_yes: MarketYes,
    market_no: MarketNo,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    ctx: &mut TxContext,
) {
    // Verify market is OPEN
    assert!(market.state == OPEN, E_MARKET_NOT_OPEN);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    
    // Call market_pool::join_coins (TreasuryCaps are stored in the pool)
    let usdo_coin = market_pool::join_coins(
        pool,
        market_yes,
        market_no,
        yes_coin,
        no_coin,
        ctx,
    );
    
    // Transfer result to tx sender
    transfer::public_transfer(usdo_coin, tx_context::sender(ctx));
}

/// Swap YES for NO (with market state check)
/// Only callable when market is OPEN
public entry fun swap_yes_for_no_for_market(
    market: &Market,
    pool: &mut MarketPool,
    yes_coin: Coin<YES_COIN>,
    min_no_out: u64,
    ctx: &mut TxContext,
) {
    // Verify market is OPEN
    assert!(market.state == OPEN, E_MARKET_NOT_OPEN);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    
    // Call market_pool::swap_yes_for_no
    let no_coin = market_pool::swap_yes_for_no(
        pool,
        yes_coin,
        min_no_out,
        ctx,
    );
    
    // Transfer result to tx sender
    transfer::public_transfer(no_coin, tx_context::sender(ctx));
}

/// Swap NO for YES (with market state check)
/// Only callable when market is OPEN
public entry fun swap_no_for_yes_for_market(
    market: &Market,
    pool: &mut MarketPool,
    no_coin: Coin<NO_COIN>,
    min_yes_out: u64,
    ctx: &mut TxContext,
) {
    // Verify market is OPEN
    assert!(market.state == OPEN, E_MARKET_NOT_OPEN);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    
    // Call market_pool::swap_no_for_yes
    let yes_coin = market_pool::swap_no_for_yes(
        pool,
        no_coin,
        min_yes_out,
        ctx,
    );
    
    // Transfer result to tx sender
    transfer::public_transfer(yes_coin, tx_context::sender(ctx));
}

/// Redeem winning YES coins (with market state check)
/// Only callable when market is RESOLVED and YES is the winning outcome
/// TreasuryCap is stored in MarketPool, so no need to pass it as argument
public entry fun redeem_winning_yes_for_market(
    market: &Market,
    pool: &mut MarketPool,
    market_yes: MarketYes,
    winning_coins: Coin<YES_COIN>,
    ctx: &mut TxContext,
) {
    // Verify market is RESOLVED
    assert!(market.state == RESOLVED, E_MARKET_NOT_RESOLVED);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    // Verify YES is the winning outcome
    assert!(*option::borrow(&market.winning_coin_type) == b"YES_COIN", E_INVALID_STATE);
    
    // Call market_pool::redeem_winning_yes_coins (TreasuryCap is stored in the pool)
    let usdo_coin = market_pool::redeem_winning_yes_coins(
        pool,
        market_yes,
        winning_coins,
        ctx,
    );
    
    // Transfer result to tx sender
    transfer::public_transfer(usdo_coin, tx_context::sender(ctx));
}

/// Redeem winning NO coins (with market state check)
/// Only callable when market is RESOLVED and NO is the winning outcome
/// TreasuryCap is stored in MarketPool, so no need to pass it as argument
public entry fun redeem_winning_no_for_market(
    market: &Market,
    pool: &mut MarketPool,
    market_no: MarketNo,
    winning_coins: Coin<NO_COIN>,
    ctx: &mut TxContext,
) {
    // Verify market is RESOLVED
    assert!(market.state == RESOLVED, E_MARKET_NOT_RESOLVED);
    // Verify pool_id matches
    assert!(market.pool_id == object::id(pool), E_INVALID_STATE);
    // Verify NO is the winning outcome
    assert!(*option::borrow(&market.winning_coin_type) == b"NO_COIN", E_INVALID_STATE);
    
    // Call market_pool::redeem_winning_no_coins (TreasuryCap is stored in the pool)
    let usdo_coin = market_pool::redeem_winning_no_coins(
        pool,
        market_no,
        winning_coins,
        ctx,
    );
    
    // Transfer result to tx sender
    transfer::public_transfer(usdo_coin, tx_context::sender(ctx));
}

#[test_only]
public fun create_test_admin_cap(ctx: &mut TxContext): ProtocolAdminCap {
    ProtocolAdminCap {
        id: object::new(ctx),
    }
}

#[test_only]
public fun transfer_admin_cap(admin_cap: ProtocolAdminCap, recipient: address) {
    transfer::transfer(admin_cap, recipient);
}

#[test_only]
public fun create_test_market(
    admin_cap: &ProtocolAdminCap,
    event_id: ID,
    treasury_cap_yes: TreasuryCap<YES_COIN>,
    treasury_cap_no: TreasuryCap<NO_COIN>,
    ctx: &mut TxContext,
): ID {
    create_market(
        admin_cap,
        event_id,
        b"Test Market",
        500, // 5% fee
        @0x0, // vault address
        treasury_cap_yes,
        treasury_cap_no,
        ctx,
    )
}


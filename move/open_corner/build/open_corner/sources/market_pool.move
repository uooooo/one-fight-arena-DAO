module open_corner::market_pool;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use open_corner::yes_coin::YES_COIN;
use open_corner::no_coin::NO_COIN;
use open_corner::usdo::USDO;

/// Market pool for binary prediction market
/// YES/NOを扱うBinary CPMM + USDO collateral
/// Formula: yes_balance * no_balance = k (constant product)
/// Collateral: 1 USDO per (YES1 + NO1) pair
public struct MarketPool has key {
    id: UID,
    market_id: ID,
    /// Binary CPMM: YES ↔ NO exchange
    yes_balance: Balance<YES_COIN>,
    no_balance: Balance<NO_COIN>,
    k: u128, // Constant product (yes_balance * no_balance)
    /// Collateral: Locked USDO (1 USDO per YES1+NO1 pair)
    collateral: Balance<USDO>,
}

/// Event emitted when USDO is split into YES/NO pair
public struct SplitUSDO has copy, drop {
    pool_id: ID,
    usdo_amount: u64,
    yes_amount: u64,
    no_amount: u64,
}

/// Event emitted when YES/NO pair is joined back to USDO
public struct JoinCoins has copy, drop {
    pool_id: ID,
    yes_amount: u64,
    no_amount: u64,
    usdo_amount: u64,
}

/// Event emitted when YES and NO are swapped
public struct SwapCoins has copy, drop {
    pool_id: ID,
    input_coin: u8, // 0 = YES, 1 = NO
    input_amount: u64,
    output_amount: u64,
}

/// Market-specific wrapper for YES coins
/// Used to tag YES coins with market_id to prevent cross-market attacks
/// Users hold this to claim payouts from the correct market
public struct MarketYes has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}

/// Market-specific wrapper for NO coins
/// Used to tag NO coins with market_id to prevent cross-market attacks
/// Users hold this to claim payouts from the correct market
public struct MarketNo has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}

/// Errors
const E_INSUFFICIENT_LIQUIDITY: u64 = 1;
const E_INSUFFICIENT_OUTPUT: u64 = 2;
const E_INVALID_AMOUNT: u64 = 3;
const E_INVALID_PAIR: u64 = 4;
const E_WRONG_MARKET: u64 = 5;

/// Initialize market pool with empty state
/// Creates an empty pool (yes_balance = 0, no_balance = 0, collateral = 0, k = 0)
/// After initialization, users can call split_usdo to mint YES/NO and lock collateral
/// Then LP can deposit YES/NO to provide liquidity to the pool
/// 
/// Flow:
/// 1. Call init_market_pool to create empty pool
/// 2. Users call split_usdo to mint YES/NO and lock collateral
/// 3. LP calls deposit_liquidity to provide YES/NO to the pool for CPMM trading
public fun init_market_pool(
    market_id: ID,
    ctx: &mut TxContext,
): ID {
    let pool = MarketPool {
        id: object::new(ctx),
        market_id,
        yes_balance: balance::zero<YES_COIN>(),
        no_balance: balance::zero<NO_COIN>(),
        k: 0,
        collateral: balance::zero<USDO>(), // Start with 0 collateral
    };
    
    let pool_id = object::id(&pool);
    transfer::share_object(pool);
    
    pool_id
}

/// Split N USDO into YES N + NO N pair (fixed 1:1 ratio)
/// USDO is locked in collateral (1 USDO per pair)
/// Returns MarketYes and MarketNo wrappers tagged with market_id
/// This ensures 1 YES = max 1 USDO payout is always guaranteed
/// This is the ONLY way to mint YES/NO coins (no unbacked coins can be created)
/// 
/// Note: 
/// - "1 USDO" means 1 unit of USDO = 10^9 base units (with 9 decimals)
/// - So "1 USDO → YES1 + NO1" means "10^9 base units USDO → 10^9 base units YES + 10^9 base units NO"
/// - In other words: N USDO (base units) → YES N (base units) + NO N (base units)
public fun split_usdo(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
): (MarketYes, MarketNo, Coin<YES_COIN>, Coin<NO_COIN>) {
    let usdo_amount = coin::value(&usdo_coin);
    assert!(usdo_amount > 0, E_INVALID_AMOUNT);
    
    // Lock USDO in collateral (1 USDO per pair)
    balance::join(&mut pool.collateral, coin::into_balance(usdo_coin));
    
    // Mint YES N + NO N (fixed 1:1 ratio, where N = usdo_amount in base units)
    let yes_coin = coin::mint<YES_COIN>(treasury_cap_yes, usdo_amount, ctx);
    let no_coin = coin::mint<NO_COIN>(treasury_cap_no, usdo_amount, ctx);
    
    // Create market-specific wrappers to tag YES/NO with market_id
    // This prevents cross-market attacks (redeeming YES from market A using market B's collateral)
    let market_yes = MarketYes {
        id: object::new(ctx),
        market_id: pool.market_id,
        amount: usdo_amount,
    };
    
    let market_no = MarketNo {
        id: object::new(ctx),
        market_id: pool.market_id,
        amount: usdo_amount,
    };
    
    event::emit(SplitUSDO {
        pool_id: object::id(pool),
        usdo_amount,
        yes_amount: usdo_amount,
        no_amount: usdo_amount,
    });
    
    (market_yes, market_no, yes_coin, no_coin)
}

/// Join YES1 + NO1 pair back into 1 USDO
/// Unlocks USDO from collateral (1:1 exchange)
/// Requires MarketYes and MarketNo wrappers to ensure correct market
/// This enables arbitrage to maintain P_yes + P_no ≈ 1
/// 
/// NOTE: Should only be callable when market is OPEN (not RESOLVED)
/// Market state management should be handled by markets.move module
public fun join_coins(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    market_yes: MarketYes,
    market_no: MarketNo,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let yes_amount = coin::value(&yes_coin);
    let no_amount = coin::value(&no_coin);
    
    // Verify market_id matches (prevents cross-market attacks)
    assert!(market_yes.market_id == pool.market_id, E_WRONG_MARKET);
    assert!(market_no.market_id == pool.market_id, E_WRONG_MARKET);
    assert!(market_yes.amount == yes_amount, E_INVALID_PAIR);
    assert!(market_no.amount == no_amount, E_INVALID_PAIR);
    
    // Must be equal amounts (1:1 pair required)
    assert!(yes_amount == no_amount, E_INVALID_PAIR);
    assert!(yes_amount > 0, E_INVALID_AMOUNT);
    
    // Burn wrappers (claim tokens are consumed)
    let MarketYes { id: yes_id, market_id: _, amount: _ } = market_yes;
    let MarketNo { id: no_id, market_id: _, amount: _ } = market_no;
    object::delete(yes_id);
    object::delete(no_id);
    
    // Burn YES and NO
    coin::burn(treasury_cap_yes, yes_coin);
    coin::burn(treasury_cap_no, no_coin);
    
    // Unlock USDO from collateral (1:1 exchange guaranteed)
    let usdo_balance = balance::split(&mut pool.collateral, yes_amount);
    let usdo_coin = coin::from_balance(usdo_balance, ctx);
    
    event::emit(JoinCoins {
        pool_id: object::id(pool),
        yes_amount,
        no_amount,
        usdo_amount: yes_amount,
    });
    
    usdo_coin
}

/// Swap YES for NO using Binary CPMM
/// Formula: yes_balance * no_balance = k (constant product, no fee)
/// USDO is not involved in this swap (only YES/NO relative price)
/// 
/// ⚠️ IMPORTANT: YES/NO obtained through swap cannot be redeemed beyond your original deposit.
/// Only the YES/NO amount matching your MarketYes/MarketNo wrapper amount can be redeemed.
/// Swap is primarily for price discovery, not for increasing your payout limit.
/// 
/// NOTE: Should only be callable when market is OPEN (not RESOLVED)
/// Market state management should be handled by markets.move module
public fun swap_yes_for_no(
    pool: &mut MarketPool,
    yes_coin: Coin<YES_COIN>,
    min_no_out: u64,
    ctx: &mut TxContext,
): Coin<NO_COIN> {
    let yes_in = coin::value(&yes_coin);
    assert!(yes_in > 0, E_INVALID_AMOUNT);
    
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    assert!(yes_balance > 0 && no_balance > 0, E_INSUFFICIENT_LIQUIDITY);
    
    // CPMM: (yes_balance + yes_in) * (no_balance - no_out) = k
    // Solving for no_out: no_out = (no_balance * yes_in) / (yes_balance + yes_in)
    let numerator = (no_balance as u128) * (yes_in as u128);
    let denominator = (yes_balance as u128) + (yes_in as u128);
    let no_out = (numerator / denominator) as u64;
    
    assert!(no_out >= min_no_out, E_INSUFFICIENT_OUTPUT);
    assert!(no_out <= no_balance, E_INSUFFICIENT_LIQUIDITY);
    
    // Update pool
    balance::join(&mut pool.yes_balance, coin::into_balance(yes_coin));
    let no_balance_out = balance::split(&mut pool.no_balance, no_out);
    
    // Update k (should remain constant, but recalculate for safety)
    let new_yes_balance = balance::value(&pool.yes_balance);
    let new_no_balance = balance::value(&pool.no_balance);
    pool.k = (new_yes_balance as u128) * (new_no_balance as u128);
    
    event::emit(SwapCoins {
        pool_id: object::id(pool),
        input_coin: 0, // YES
        input_amount: yes_in,
        output_amount: no_out,
    });
    
    coin::from_balance(no_balance_out, ctx)
}

/// Swap NO for YES using Binary CPMM
/// Formula: yes_balance * no_balance = k (constant product, no fee)
/// USDO is not involved in this swap (only YES/NO relative price)
/// 
/// ⚠️ Same constraints as swap_yes_for_no:
/// - YES/NO obtained through swap cannot be redeemed beyond your original deposit
/// - Only the amount matching your MarketYes/MarketNo wrapper can be redeemed
/// 
/// NOTE: Should only be callable when market is OPEN (not RESOLVED)
/// Market state management should be handled by markets.move module
public fun swap_no_for_yes(
    pool: &mut MarketPool,
    no_coin: Coin<NO_COIN>,
    min_yes_out: u64,
    ctx: &mut TxContext,
): Coin<YES_COIN> {
    let no_in = coin::value(&no_coin);
    assert!(no_in > 0, E_INVALID_AMOUNT);
    
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    assert!(yes_balance > 0 && no_balance > 0, E_INSUFFICIENT_LIQUIDITY);
    
    // CPMM: (yes_balance - yes_out) * (no_balance + no_in) = k
    // Solving for yes_out: yes_out = (yes_balance * no_in) / (no_balance + no_in)
    let numerator = (yes_balance as u128) * (no_in as u128);
    let denominator = (no_balance as u128) + (no_in as u128);
    let yes_out = (numerator / denominator) as u64;
    
    assert!(yes_out >= min_yes_out, E_INSUFFICIENT_OUTPUT);
    assert!(yes_out <= yes_balance, E_INSUFFICIENT_LIQUIDITY);
    
    // Update pool
    balance::join(&mut pool.no_balance, coin::into_balance(no_coin));
    let yes_balance_out = balance::split(&mut pool.yes_balance, yes_out);
    
    // Update k (should remain constant, but recalculate for safety)
    let new_yes_balance = balance::value(&pool.yes_balance);
    let new_no_balance = balance::value(&pool.no_balance);
    pool.k = (new_yes_balance as u128) * (new_no_balance as u128);
    
    event::emit(SwapCoins {
        pool_id: object::id(pool),
        input_coin: 1, // NO
        input_amount: no_in,
        output_amount: yes_out,
    });
    
    coin::from_balance(yes_balance_out, ctx)
}

/// Get current pool balances
/// Returns (yes_balance, no_balance, collateral_balance)
public fun get_pool_balances(pool: &MarketPool): (u64, u64, u64) {
    (
        balance::value(&pool.yes_balance),
        balance::value(&pool.no_balance),
        balance::value(&pool.collateral),
    )
}

/// Get expected output amount for swapping YES to NO
/// View function for price estimation
public fun get_amount_out_yes_for_no(
    pool: &MarketPool,
    yes_in: u64,
): u64 {
    if (yes_in == 0) {
        return 0
    };
    
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    if (yes_balance == 0 || no_balance == 0) {
        return 0
    };
    
    let numerator = (no_balance as u128) * (yes_in as u128);
    let denominator = (yes_balance as u128) + (yes_in as u128);
    (numerator / denominator) as u64
}

/// Get expected output amount for swapping NO to YES
/// View function for price estimation
public fun get_amount_out_no_for_yes(
    pool: &MarketPool,
    no_in: u64,
): u64 {
    if (no_in == 0) {
        return 0
    };
    
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    if (yes_balance == 0 || no_balance == 0) {
        return 0
    };
    
    let numerator = (yes_balance as u128) * (no_in as u128);
    let denominator = (no_balance as u128) + (no_in as u128);
    (numerator / denominator) as u64
}

/// Calculate normalized price of YES (P_yes)
/// Returns P_yes such that P_yes + P_no ≈ 1
/// P_yes = no_balance / (yes_balance + no_balance)
public fun get_yes_price_normalized(pool: &MarketPool): u64 {
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    if (yes_balance == 0 || no_balance == 0) {
        return 500_000_000_000_000_000 // 0.5 (50%) as default
    };
    
    let total_balance = yes_balance + no_balance;
    // P_yes = no_balance / (yes_balance + no_balance)
    // Return as basis points (multiply by 10^9 for decimals)
    ((no_balance as u128 * 1_000_000_000) / (total_balance as u128)) as u64
}

/// Calculate normalized price of NO (P_no)
/// Returns P_no such that P_yes + P_no ≈ 1
/// P_no = yes_balance / (yes_balance + no_balance)
public fun get_no_price_normalized(pool: &MarketPool): u64 {
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    if (yes_balance == 0 || no_balance == 0) {
        return 500_000_000_000_000_000 // 0.5 (50%) as default
    };
    
    let total_balance = yes_balance + no_balance;
    // P_no = yes_balance / (yes_balance + no_balance)
    // Return as basis points (multiply by 10^9 for decimals)
    ((yes_balance as u128 * 1_000_000_000) / (total_balance as u128)) as u64
}

/// Redeem winning YES coins for USDO from collateral
/// Requires MarketYes wrapper to ensure correct market
/// Payout: 1 YES = 1 USDO (guaranteed by collateral design)
/// 
/// ⚠️ IMPORTANT: wrapper.amount == coin_amount must match exactly
/// This means you can only redeem YES/NO up to your original split amount.
/// YES/NO obtained through swap cannot be redeemed beyond your original deposit.
/// 
/// Example:
/// - split_usdo(1 USDO) → MarketYes(amount=1), YES 1, NO 1
/// - swap_no_for_yes(NO 1) → YES 2 (increased through swap)
/// - redeem_winning_yes_coins(MarketYes(amount=1), YES 1) → 1 USDO ✅
/// - redeem_winning_yes_coins(MarketYes(amount=1), YES 2) → FAIL ❌ (amount mismatch)
/// 
/// This is a security feature (prevents 1 wrapper redeeming large amounts),
/// but also means MVP works as "binary bet with fixed payout = original deposit".
/// 
/// NOTE: Should only be callable when market is RESOLVED and YES is the winning outcome
/// Market state management should be handled by markets.move module
public fun redeem_winning_yes_coins(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    market_yes: MarketYes,
    winning_coins: Coin<YES_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let coin_amount = coin::value(&winning_coins);
    assert!(coin_amount > 0, E_INVALID_AMOUNT);
    
    // Verify market_id matches
    assert!(market_yes.market_id == pool.market_id, E_WRONG_MARKET);
    assert!(market_yes.amount == coin_amount, E_INVALID_AMOUNT);
    
    // Burn wrapper
    let MarketYes { id, market_id: _, amount: _ } = market_yes;
    object::delete(id);
    
    // Burn winning YES coins
    coin::burn(treasury_cap_yes, winning_coins);
    
    // Pay out from collateral (1:1 exchange guaranteed)
    let collateral_balance = balance::split(&mut pool.collateral, coin_amount);
    coin::from_balance(collateral_balance, ctx)
}

/// Redeem winning NO coins for USDO from collateral
/// Requires MarketNo wrapper to ensure correct market
/// Payout: 1 NO = 1 USDO (guaranteed by collateral design)
/// 
/// ⚠️ Same constraints as redeem_winning_yes_coins:
/// - wrapper.amount == coin_amount must match exactly
/// - Only original deposit amount can be redeemed
/// - YES/NO obtained through swap cannot be redeemed beyond original deposit
/// 
/// NOTE: Should only be callable when market is RESOLVED and NO is the winning outcome
/// Market state management should be handled by markets.move module
public fun redeem_winning_no_coins(
    pool: &mut MarketPool,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    market_no: MarketNo,
    winning_coins: Coin<NO_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let coin_amount = coin::value(&winning_coins);
    assert!(coin_amount > 0, E_INVALID_AMOUNT);
    
    // Verify market_id matches
    assert!(market_no.market_id == pool.market_id, E_WRONG_MARKET);
    assert!(market_no.amount == coin_amount, E_INVALID_AMOUNT);
    
    // Burn wrapper
    let MarketNo { id, market_id: _, amount: _ } = market_no;
    object::delete(id);
    
    // Burn winning NO coins
    coin::burn(treasury_cap_no, winning_coins);
    
    // Pay out from collateral (1:1 exchange guaranteed)
    let collateral_balance = balance::split(&mut pool.collateral, coin_amount);
    coin::from_balance(collateral_balance, ctx)
}

/// Deposit YES/NO liquidity to the pool for CPMM trading
/// **INTERNAL USE ONLY** - Not exposed to end users in MVP
/// 
/// WARNING: This function is incomplete for public LP use:
/// - No withdraw_liquidity function exists
/// - Wrapper amount consistency check conflicts with LP design
/// - Users would lose access to their position after depositing
/// 
/// For MVP: Use this only for protocol-internal initial liquidity setup
/// For future: Implement LP share tokens + withdraw_liquidity before public use
/// 
/// This allows users to swap YES ↔ NO through the pool
public fun deposit_liquidity(
    pool: &mut MarketPool,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    _ctx: &mut TxContext,
) {
    let yes_amount = coin::value(&yes_coin);
    let no_amount = coin::value(&no_coin);
    
    assert!(yes_amount > 0 && no_amount > 0, E_INVALID_AMOUNT);
    
    // Add coins to pool
    balance::join(&mut pool.yes_balance, coin::into_balance(yes_coin));
    balance::join(&mut pool.no_balance, coin::into_balance(no_coin));
    
    // Update k (constant product)
    let new_yes_balance = balance::value(&pool.yes_balance);
    let new_no_balance = balance::value(&pool.no_balance);
    pool.k = (new_yes_balance as u128) * (new_no_balance as u128);
}

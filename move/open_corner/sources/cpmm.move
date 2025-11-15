module open_corner::cpmm;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// CPMM Pool for prediction market
/// Manages liquidity pool using constant product formula: x * y = k
public struct Pool<phantom X, phantom Y> has key {
    id: UID,
    /// Balance of coin X
    x_balance: Balance<X>,
    /// Balance of coin Y
    y_balance: Balance<Y>,
    /// Fee in basis points (e.g., 500 = 5%)
    fee_bps: u64,
}

/// Event emitted when liquidity is added
public struct LiquidityAdded<phantom X, phantom Y> has copy, drop {
    pool_id: ID,
    x_amount: u64,
    y_amount: u64,
}

/// Event emitted when liquidity is removed
public struct LiquidityRemoved<phantom X, phantom Y> has copy, drop {
    pool_id: ID,
    x_amount: u64,
    y_amount: u64,
}

/// Event emitted when a swap occurs
public struct Swap<phantom X, phantom Y> has copy, drop {
    pool_id: ID,
    input_coin: u8, // 0 = X, 1 = Y
    input_amount: u64,
    output_amount: u64,
}

/// Errors
const E_INSUFFICIENT_LIQUIDITY: u64 = 1;
const E_INSUFFICIENT_OUTPUT: u64 = 2;
const E_INVALID_FEE: u64 = 3;
const E_INVALID_AMOUNT: u64 = 4;
const E_EMPTY_BALANCE: u64 = 5;

/// Fee denominator (10000 = 100% in basis points)
const FEE_DENOMINATOR: u64 = 10000;

/// Create a new CPMM pool
/// Returns the pool ID
public fun create_pool<X, Y>(
    initial_x: Coin<X>,
    initial_y: Coin<Y>,
    fee_bps: u64,
    ctx: &mut TxContext,
): ID {
    assert!(fee_bps <= 10000, E_INVALID_FEE); // Max 100% fee
    
    let x_amount = coin::value(&initial_x);
    let y_amount = coin::value(&initial_y);
    
    assert!(x_amount > 0 && y_amount > 0, E_INVALID_AMOUNT);
    
    let pool = Pool {
        id: object::new(ctx),
        x_balance: coin::into_balance(initial_x),
        y_balance: coin::into_balance(initial_y),
        fee_bps,
    };
    
    let pool_id = object::id(&pool);
    transfer::share_object(pool);
    
    pool_id
}

/// Add liquidity to the pool
/// Returns LP tokens (simplified - for MVP, we don't track LP tokens)
public fun add_liquidity<X, Y>(
    pool: &mut Pool<X, Y>,
    x_coin: Coin<X>,
    y_coin: Coin<Y>,
    ctx: &mut TxContext,
) {
    let x_amount = coin::value(&x_coin);
    let y_amount = coin::value(&y_coin);
    
    assert!(x_amount > 0 && y_amount > 0, E_INVALID_AMOUNT);
    
    // For MVP, we maintain the ratio (x * y = k should remain constant)
    // In production, we'd calculate the optimal ratio based on current pool state
    let current_x = balance::value(&pool.x_balance);
    let current_y = balance::value(&pool.y_balance);
    
    // Maintain the same ratio
    if (current_x > 0 && current_y > 0) {
        // Calculate expected y_amount based on current ratio
        let expected_y = (x_amount * current_y) / current_x;
        // For MVP, we accept the provided amounts (should match ratio in production)
    };
    
    balance::join(&mut pool.x_balance, coin::into_balance(x_coin));
    balance::join(&mut pool.y_balance, coin::into_balance(y_coin));
    
    event::emit(LiquidityAdded<X, Y> {
        pool_id: object::id(pool),
        x_amount,
        y_amount,
    });
}

/// Remove liquidity from the pool
/// For MVP, we remove proportional amounts
public fun remove_liquidity<X, Y>(
    pool: &mut Pool<X, Y>,
    x_amount: u64,
    y_amount: u64,
    ctx: &mut TxContext,
): (Coin<X>, Coin<Y>) {
    let current_x = balance::value(&pool.x_balance);
    let current_y = balance::value(&pool.y_balance);
    
    assert!(x_amount <= current_x && y_amount <= current_y, E_INSUFFICIENT_LIQUIDITY);
    
    let x_balance = balance::split(&mut pool.x_balance, x_amount);
    let y_balance = balance::split(&mut pool.y_balance, y_amount);
    
    event::emit(LiquidityRemoved<X, Y> {
        pool_id: object::id(pool),
        x_amount,
        y_amount,
    });
    
    (coin::from_balance(x_balance, ctx), coin::from_balance(y_balance, ctx))
}

/// Swap X for Y (using Y as quote currency)
/// Formula: (x + Δx_effective) * (y - Δy) = x * y
/// Where Δx_effective = Δx * (1 - fee_bps/10000) - fee is applied to input
/// This ensures k increases by fee amount, maintaining constant product invariant
/// Implementation follows Uniswap V2 style: amountOut = (amountIn * fee_factor * reserveOut) / ((reserveIn * FEE_DENOMINATOR) + (amountIn * fee_factor))
public fun swap_x_for_y<X, Y>(
    pool: &mut Pool<X, Y>,
    x_coin: Coin<X>,
    min_y_out: u64,
    ctx: &mut TxContext,
): Coin<Y> {
    let x_in = coin::value(&x_coin);
    assert!(x_in > 0, E_INVALID_AMOUNT);
    
    let x_balance = balance::value(&pool.x_balance);
    let y_balance = balance::value(&pool.y_balance);
    
    assert!(x_balance > 0 && y_balance > 0, E_INSUFFICIENT_LIQUIDITY);
    
    // Apply fee to input (Uniswap V2 style)
    // fee_factor = 10000 - fee_bps (e.g., 500 bps = 9500 for 5% fee)
    let fee_factor = FEE_DENOMINATOR - pool.fee_bps;
    
    // Calculate output: amountOut = (amountIn * fee_factor * reserveOut) / ((reserveIn * FEE_DENOMINATOR) + (amountIn * fee_factor))
    let numerator = x_in * fee_factor * y_balance;
    let denominator = (x_balance * FEE_DENOMINATOR) + (x_in * fee_factor);
    let y_out = numerator / denominator;
    
    assert!(y_out >= min_y_out, E_INSUFFICIENT_OUTPUT);
    assert!(y_out <= y_balance, E_INSUFFICIENT_LIQUIDITY);
    
    // Update pool balances
    balance::join(&mut pool.x_balance, coin::into_balance(x_coin));
    let y_balance_out = balance::split(&mut pool.y_balance, y_out);
    
    event::emit(Swap<X, Y> {
        pool_id: object::id(pool),
        input_coin: 0, // X
        input_amount: x_in,
        output_amount: y_out,
    });
    
    coin::from_balance(y_balance_out, ctx)
}

/// Swap Y for X (using Y as base currency)
/// Formula: (x - Δx) * (y + Δy_effective) = x * y
/// Where Δy_effective = Δy * (1 - fee_bps/10000) - fee is applied to input
/// This ensures k increases by fee amount, maintaining constant product invariant
/// Implementation follows Uniswap V2 style: amountOut = (amountIn * fee_factor * reserveOut) / ((reserveIn * FEE_DENOMINATOR) + (amountIn * fee_factor))
public fun swap_y_for_x<X, Y>(
    pool: &mut Pool<X, Y>,
    y_coin: Coin<Y>,
    min_x_out: u64,
    ctx: &mut TxContext,
): Coin<X> {
    let y_in = coin::value(&y_coin);
    assert!(y_in > 0, E_INVALID_AMOUNT);
    
    let x_balance = balance::value(&pool.x_balance);
    let y_balance = balance::value(&pool.y_balance);
    
    assert!(x_balance > 0 && y_balance > 0, E_INSUFFICIENT_LIQUIDITY);
    
    // Apply fee to input (Uniswap V2 style)
    // fee_factor = 10000 - fee_bps (e.g., 500 bps = 9500 for 5% fee)
    let fee_factor = FEE_DENOMINATOR - pool.fee_bps;
    
    // Calculate output: amountOut = (amountIn * fee_factor * reserveOut) / ((reserveIn * FEE_DENOMINATOR) + (amountIn * fee_factor))
    let numerator = y_in * fee_factor * x_balance;
    let denominator = (y_balance * FEE_DENOMINATOR) + (y_in * fee_factor);
    let x_out = numerator / denominator;
    
    assert!(x_out >= min_x_out, E_INSUFFICIENT_OUTPUT);
    assert!(x_out <= x_balance, E_INSUFFICIENT_LIQUIDITY);
    
    // Update pool balances
    balance::join(&mut pool.y_balance, coin::into_balance(y_coin));
    let x_balance_out = balance::split(&mut pool.x_balance, x_out);
    
    event::emit(Swap<X, Y> {
        pool_id: object::id(pool),
        input_coin: 1, // Y
        input_amount: y_in,
        output_amount: x_out,
    });
    
    coin::from_balance(x_balance_out, ctx)
}

/// Get current price of X in terms of Y
/// Returns (x_balance, y_balance) which can be used to calculate price
public fun get_pool_balances<X, Y>(pool: &Pool<X, Y>): (u64, u64) {
    (balance::value(&pool.x_balance), balance::value(&pool.y_balance))
}

/// Get the expected output amount for swapping X to Y
/// This is a view function for price estimation
/// Uses the same formula as swap_x_for_y
public fun get_amount_out_x_for_y<X, Y>(
    pool: &Pool<X, Y>,
    x_in: u64,
): u64 {
    if (x_in == 0) {
        return 0
    };
    
    let x_balance = balance::value(&pool.x_balance);
    let y_balance = balance::value(&pool.y_balance);
    
    if (x_balance == 0 || y_balance == 0) {
        return 0
    };
    
    // Apply fee to input (same as swap_x_for_y)
    let fee_factor = FEE_DENOMINATOR - pool.fee_bps;
    
    let numerator = x_in * fee_factor * y_balance;
    let denominator = (x_balance * FEE_DENOMINATOR) + (x_in * fee_factor);
    numerator / denominator
}

/// Get the expected output amount for swapping Y to X
/// This is a view function for price estimation
/// Uses the same formula as swap_y_for_x
public fun get_amount_out_y_for_x<X, Y>(
    pool: &Pool<X, Y>,
    y_in: u64,
): u64 {
    if (y_in == 0) {
        return 0
    };
    
    let x_balance = balance::value(&pool.x_balance);
    let y_balance = balance::value(&pool.y_balance);
    
    if (x_balance == 0 || y_balance == 0) {
        return 0
    };
    
    // Apply fee to input (same as swap_y_for_x)
    let fee_factor = FEE_DENOMINATOR - pool.fee_bps;
    
    let numerator = y_in * fee_factor * x_balance;
    let denominator = (y_balance * FEE_DENOMINATOR) + (y_in * fee_factor);
    numerator / denominator
}

/// Extract fee from pool (for market resolution)
/// Transfers accumulated fees to a recipient
public fun extract_fees<X, Y>(
    pool: &mut Pool<X, Y>,
    x_fee_amount: u64,
    y_fee_amount: u64,
    ctx: &mut TxContext,
): (Coin<X>, Coin<Y>) {
    let x_balance = balance::value(&pool.x_balance);
    let y_balance = balance::value(&pool.y_balance);
    
    assert!(x_fee_amount <= x_balance && y_fee_amount <= y_balance, E_INSUFFICIENT_LIQUIDITY);
    
    let x_fee_balance = balance::split(&mut pool.x_balance, x_fee_amount);
    let y_fee_balance = balance::split(&mut pool.y_balance, y_fee_amount);
    
    (coin::from_balance(x_fee_balance, ctx), coin::from_balance(y_fee_balance, ctx))
}


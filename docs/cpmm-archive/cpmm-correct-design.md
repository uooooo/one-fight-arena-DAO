# CPMM予測市場の正しい設計

## 設計方針（修正版）

### 1. コアコンセプト

**ユーザーの提案:**
1. 1 USDOを送ると、`x*P_yes + y*P_no = 1 USDO` となるYES/NOがmintされる
2. その後、CPMMでYES/NOを取引できる
3. `P_yes + P_no = 1`が保証される

### 2. 実装方法の考察

#### 2-1. Split機能（1 USDO → YES + NO）

**基本ロジック:**
```
1 USDO → (x YES, y NO) をミント
条件: x*P_yes + y*P_no = 1 USDO
```

**シンプルな実装:**
- `x = 1, y = 1` で常にミント（1 YES + 1 NO = 1 USDOの価値）
- ただし、CPMMの価格が`P_yes + P_no = 1`になるように調整される

**問題点:**
- もしCPMMの価格が`P_yes + P_no < 1`なら、アービトラージで調整される
- もしCPMMの価格が`P_yes + P_no > 1`なら、アービトラージで調整される

**正しい実装:**
```
1. CPMMの現在価格から P_yes と P_no を計算
2. x*P_yes + y*P_no = 1 USDO となる x, y を決定
3. もし x = y = 1 が理想なら、P_yes + P_no = 1 になるようにプールを初期化
```

#### 2-2. プール構造

**選択肢A: 単一プール（YES/NO/USDOの3変数）**
```
Pool {
    yes_balance: Balance<YES_COIN>,
    no_balance: Balance<NO_COIN>,
    usdo_balance: Balance<USDO>,
}
公式: yes_balance * no_balance * usdo_balance = k (3変数CPMM)
```

**選択肢B: 2独立プール + Split/Join**
```
Pool<YES_COIN, USDO>  // YES/USDO プール
Pool<NO_COIN, USDO>   // NO/USDO プール
公式: YES_pool: x_yes * y_usdo = k_yes
     NO_pool: x_no * y_usdo = k_no
Split: 1 USDO → (x YES, y NO) where x*P_yes + y*P_no = 1 USDO
Join: (1 YES, 1 NO) → 1 USDO
```

**選択肢C: Binary CPMM（推奨）**
```
単一プール: YES_COIN / NO_COIN の2変数CPMM
公式: yes_balance * no_balance = k
USDOは外部から供給（Split時に1 USDOを受け取り、YES/NOをミント）
```

#### 2-3. ユーザーの提案の解釈

ユーザーが言っている「x*P_yes + y*P_no = 1 USDOとなるP_yesとP_noがmintされる」は：

1. **Split操作**: 1 USDO → (x YES, y NO)
   - CPMMの現在価格から`x`と`y`を計算
   - `x*P_yes + y*P_no = 1 USDO`を満たすようにミント

2. **CPMMプール**: YES/NOの取引
   - YESとNOを交換できるCPMMプール
   - 価格は自動的に調整される

3. **`P_yes + P_no = 1`の保証**:
   - Splitで常に1 USDO = x YES + y NOが保証される
   - もし`P_yes + P_no < 1`なら、Join（(1 YES, 1 NO) → 1 USDO）でアービトラージ
   - もし`P_yes + P_no > 1`なら、Split（1 USDO → YES + NO）でアービトラージ
   - これにより`P_yes + P_no ≈ 1`に近づく

### 3. 推奨実装（Binary CPMM）

#### 3-1. プール構造

```move
/// Binary CPMM pool for YES/NO prediction market
/// Formula: yes_balance * no_balance = k
/// USDO is supplied externally (via split) and used for payouts
public struct MarketPool has key {
    id: UID,
    market_id: ID,
    yes_balance: Balance<YES_COIN>,
    no_balance: Balance<NO_COIN>,
    k: u128, // Constant product (yes_balance * no_balance)
}
```

#### 3-2. Split機能（1 USDO → YES + NO）

```move
/// Split 1 USDO into YES and NO coins
/// Mints YES and NO such that x*P_yes + y*P_no = 1 USDO
/// If P_yes + P_no = 1, then x = y = 1 (ideal case)
public fun split_usdo<MarketId>(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
): (Coin<YES_COIN>, Coin<NO_COIN>) {
    let usdo_amount = coin::value(&usdo_coin);
    assert!(usdo_amount > 0, E_INVALID_AMOUNT);
    
    // Get current prices from CPMM
    let yes_balance = balance::value(&pool.yes_balance);
    let no_balance = balance::value(&pool.no_balance);
    
    // Calculate current prices: P_yes = no_balance / yes_balance, P_no = yes_balance / no_balance
    // Normalized: P_yes + P_no = 1 (if pool is balanced)
    let yes_price = if (yes_balance > 0) {
        (no_balance * 10^9) / yes_balance  // Assuming 9 decimals
    } else {
        500000000  // 0.5 USDO (initial price)
    };
    let no_price = if (no_balance > 0) {
        (yes_balance * 10^9) / no_balance
    } else {
        500000000  // 0.5 USDO (initial price)
    };
    
    // Calculate x and y such that x*P_yes + y*P_no = 1 USDO
    // If P_yes + P_no = 1, then x = y = usdo_amount
    // Otherwise, we need to solve: x*P_yes + y*P_no = usdo_amount
    // With constraint: ideally x = y (equal split)
    
    // For simplicity, if P_yes + P_no ≈ 1, mint equal amounts
    // Otherwise, adjust based on prices
    let total_price = yes_price + no_price;
    let yes_amount = (usdo_amount * yes_price) / total_price;
    let no_amount = (usdo_amount * no_price) / total_price;
    
    // Mint YES and NO coins
    let yes_coin = coin::mint_and_transfer<YES_COIN>(
        treasury_cap_yes,
        yes_amount,
        tx_context::sender(ctx),
        ctx,
    );
    let no_coin = coin::mint_and_transfer<NO_COIN>(
        treasury_cap_no,
        no_amount,
        tx_context::sender(ctx),
        ctx,
    );
    
    // Add coins to pool (for CPMM trading)
    balance::join(&mut pool.yes_balance, coin::into_balance(yes_coin));
    balance::join(&mut pool.no_balance, coin::into_balance(no_coin));
    
    // Update k
    pool.k = balance::value(&pool.yes_balance) * balance::value(&pool.no_balance);
    
    // Return the coins to user
    let user_yes = coin::mint_and_transfer<YES_COIN>(treasury_cap_yes, yes_amount, tx_context::sender(ctx), ctx);
    let user_no = coin::mint_and_transfer<NO_COIN>(treasury_cap_no, no_amount, tx_context::sender(ctx), ctx);
    
    (user_yes, user_no)
}
```

#### 3-3. Join機能（YES + NO → USDO）

```move
/// Join YES and NO coins back into USDO
/// Burns YES and NO, mints USDO
/// Ensures P_yes + P_no ≈ 1 through arbitrage
public fun join_coins<MarketId>(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    treasury_cap_usdo: &mut TreasuryCap<USDO>,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let yes_amount = coin::value(&yes_coin);
    let no_amount = coin::value(&no_coin);
    
    // Remove from pool
    let yes_balance = coin::into_balance(yes_coin);
    let no_balance = coin::into_balance(no_coin);
    balance::join(&mut pool.yes_balance, yes_balance);
    balance::join(&mut pool.no_balance, no_balance);
    
    // Calculate payout: ideally 1 YES + 1 NO = 1 USDO
    // If amounts are equal, return equal amount in USDO
    let payout = if (yes_amount == no_amount) {
        yes_amount  // 1:1 exchange
    } else {
        // Use minimum amount (conservative)
        if (yes_amount < no_amount) {
            yes_amount
        } else {
            no_amount
        }
    };
    
    // Burn YES and NO
    coin::burn(treasury_cap_yes, yes_coin);
    coin::burn(treasury_cap_no, no_coin);
    
    // Mint USDO
    coin::mint_and_transfer<USDO>(treasury_cap_usdo, payout, tx_context::sender(ctx), ctx)
}
```

#### 3-4. CPMM取引（YES ↔ NO）

```move
/// Swap YES for NO using CPMM
/// Formula: yes_balance * no_balance = k
/// No fee (as per user requirement)
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
    
    // CPMM formula: (yes_balance + yes_in) * (no_balance - no_out) = k
    // Solving for no_out: no_out = (no_balance * yes_in) / (yes_balance + yes_in)
    let numerator = no_balance * yes_in;
    let denominator = yes_balance + yes_in;
    let no_out = numerator / denominator;
    
    assert!(no_out >= min_no_out, E_INSUFFICIENT_OUTPUT);
    assert!(no_out <= no_balance, E_INSUFFICIENT_LIQUIDITY);
    
    // Update pool
    balance::join(&mut pool.yes_balance, coin::into_balance(yes_coin));
    let no_balance_out = balance::split(&mut pool.no_balance, no_out);
    
    // Update k (should remain constant, but recalculate for safety)
    pool.k = balance::value(&pool.yes_balance) * balance::value(&pool.no_balance);
    
    coin::from_balance(no_balance_out, ctx)
}
```

### 4. 市場ごとのYES/NOコイン

**実装方法:**
- 各市場で独立した`MarketPool`を作成
- `MarketPool`に`market_id`を保存
- YES/NOコインは共通だが、`MarketPool`で市場ごとに区別

**または（より厳密）:**
- 各市場で独立したYES/NOコインを作成（`coin::create_currency`で各市場ごとに呼び出し）
- 市場ごとに異なるコインタイプ（例: `YES_MARKET_0x123`, `NO_MARKET_0x123`）

### 5. 初期化

```move
/// Initialize market pool with initial liquidity
/// Creates YES/NO pool with initial balances
public fun init_market_pool<MarketId>(
    market_id: ID,
    initial_yes: u64,
    initial_no: u64,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    ctx: &mut TxContext,
): ID {
    // Mint initial YES and NO
    let yes_coin = coin::mint<YES_COIN>(treasury_cap_yes, initial_yes, ctx);
    let no_coin = coin::mint<NO_COIN>(treasury_cap_no, initial_no, ctx);
    
    // Create pool
    let pool = MarketPool {
        id: object::new(ctx),
        market_id,
        yes_balance: coin::into_balance(yes_coin),
        no_balance: coin::into_balance(no_coin),
        k: initial_yes * initial_no,
    };
    
    let pool_id = object::id(&pool);
    transfer::share_object(pool);
    
    pool_id
}
```

### 6. 決済ロジック

```move
/// Resolve market and payout winners
/// Winners can redeem their coins for USDO
public fun redeem_winning_coins(
    pool: &mut MarketPool,
    treasury_cap_usdo: &mut TreasuryCap<USDO>,
    winning_coins: Coin<YES_COIN>, // or NO_COIN depending on outcome
    ctx: &mut TxContext,
): Coin<USDO> {
    let coin_amount = coin::value(&winning_coins);
    
    // For now, simple 1:1 exchange (1 coin = 1 USDO)
    // In production, might need more sophisticated logic
    let payout = coin_amount;
    
    // Burn winning coins
    coin::burn(treasury_cap_yes, winning_coins); // or treasury_cap_no
    
    // Mint USDO
    coin::mint_and_transfer<USDO>(treasury_cap_usdo, payout, tx_context::sender(ctx), ctx)
}
```

## まとめ

1. **Binary CPMM**: YES/NOの2変数CPMM（`yes * no = k`）
2. **Split/Join**: 1 USDO ↔ (YES, NO) の変換で`P_yes + P_no = 1`を保証
3. **手数料なし**: すべての取引でfee = 0
4. **市場ごとの管理**: 各市場で独立した`MarketPool`を作成
5. **初期化**: 初期流動性を提供してプールを作成


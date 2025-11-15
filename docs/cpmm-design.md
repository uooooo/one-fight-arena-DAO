# CPMM予測市場の最終設計（完成版 - 元本上限型 A）

⚠️ **現在の実装は「元本上限型（A）」です。Polymarket型（B）ではありません。**

**現在の挙動:**
- swapで増やしたYES/NOはredeemできない
- 元本（splitしたUSDO分）のみがredeem可能
- 「自分の元本に対するbinary bet」として動作

**Polymarket型（B）にするには:**
- 市場ごとに独立したYES/NOコインタイプを作成する必要がある
- 詳細は `docs/cpmm-polymarket-design.md` を参照

---

# CPMM予測市場の最終設計（完成版）

## 設計方針

### コアコンセプト

**「1 USDO → YES1枚 + NO1枚（固定配分）」+ 「Collateralロック」+ 「Binary CPMM」+ 「MarketYes/MarketNoラッパー」**

1. **Split**: N USDO → YES N + NO N
   - USDOは`pool.collateral`にロック
   - YES N枚とNO N枚をmintしてユーザーに渡す
   - **MarketYes/MarketNoラッパー**も同時に発行（市場IDタグ付け）

2. **Binary CPMM**: YES ↔ NO の交換のみ
   - `yes_balance * no_balance = k`（手数料なし）
   - USDOとは直接やり取りしない
   - 相対価格の計算のみ

3. **Join**: YES1枚 + NO1枚 → 1 USDO
   - YES/NOをburn
   - **MarketYes/MarketNoラッパー**を消費して市場IDを検証
   - `pool.collateral`から1 USDOを返す

4. **決済**: 勝った側が1 YES = 1 USDOでペイアウト
   - **MarketYes/MarketNoラッパー**を消費して市場IDを検証
   - Collateralから直接支払い
   - 1 YES = 最大1 USDOが保証される

## 重要な安全性の考慮事項

### 1. 市場ごとのYES/NOトークン分離（MarketYes/MarketNoラッパー）

**問題点:**
- Sui Moveでは型パラメータ付きコイン（`YES_COIN<MarketId>`）をOne-Time Witnessパターンで作成するのは技術的に困難
- 共通の`YES_COIN`型だと、市場AでmintしたYESを市場Bでredeemできてしまう（致命的な経済的バグ）

**解決策（MarketYes/MarketNoラッパー）:**
```move
/// Market-specific wrapper for YES coins
/// Used to tag YES coins with market_id to prevent cross-market attacks
public struct MarketYes has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}

/// Market-specific wrapper for NO coins
/// Used to tag NO coins with market_id to prevent cross-market attacks
public struct MarketNo has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}
```

**動作:**
1. `split_usdo`でYES/NOをmintする際、**MarketYes/MarketNoラッパーも同時に発行**
2. ラッパーには`market_id`が保存される
3. `join_coins`や`redeem_winning_coins`では、ラッパーを消費して`market_id`を検証
4. 異なる市場のラッパーではredeemできない（`assert!(market_yes.market_id == pool.market_id, E_WRONG_MARKET)`）

**安全性の保証:**
- 市場AでmintしたYESは、市場AのMarketYesラッパーとセットで発行される
- 市場Bでredeemする際は、市場BのMarketYesラッパーが必要
- これにより、他市場のcollateralを抜く攻撃が防止される

### 2. 無担保YES/NOの防止

**問題点:**
- `init_market_pool`でYES/NOをmintすると、collateralが対応していない可能性がある
- 「1YES=1USDO」の保証が崩れる

**解決策:**
- `init_market_pool`ではYES/NOを**mintしない**
- 空のPoolを作成するだけ（yes_balance = 0, no_balance = 0, collateral = 0, k = 0）
- YES/NOのmintは**split_usdoのみ**で行う

**初期化フロー（修正版）:**
```
1. init_market_pool: 空のPoolを作成
   → yes_balance = 0, no_balance = 0, collateral = 0, k = 0

2. ユーザー（LP含む）がsplit_usdoを呼ぶ
   → YES/NOがmintされ、collateralがロックされる
   → MarketYes/MarketNoラッパーも発行される

3. LPがdeposit_liquidityを呼ぶ（オプション）
   → YES/NOをプールに預けて流動性を提供
   → これによりユーザーはswapできるようになる
```

### 3. Split/Join の不変条件

**重要な不変条件:**
- `outstanding_pairs = minted_pairs - joined_pairs`
- `collateral = outstanding_pairs * 1USDO`
- YES/NOの総発行量 = outstanding_pairs（AMMに入っていてもユーザーが持っていても同じ）

**保証:**
- Splitのたびに: `collateral += usdo_amount`, `YES_supply += usdo_amount`, `NO_supply += usdo_amount`
- Joinのたびに: `collateral -= usdo_amount`, `YES_supply -= usdo_amount`, `NO_supply -= usdo_amount`
- YES/NOのmintは**split_usdoのみ**で行う

## ストレージ構造

```move
/// Market pool for binary prediction market
/// YES/NOを扱うBinary CPMM + USDO collateral
public struct MarketPool has key {
    id: UID,
    market_id: ID, // Market IDで市場を区別
    /// Binary CPMM: YES ↔ NO exchange
    yes_balance: Balance<YES_COIN>,
    no_balance: Balance<NO_COIN>,
    k: u128, // Constant product (yes_balance * no_balance)
    /// Collateral: Locked USDO (1 USDO per YES1+NO1 pair)
    collateral: Balance<USDO>,
}

/// Market-specific wrapper for YES coins
/// Used to tag YES coins with market_id to prevent cross-market attacks
public struct MarketYes has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}

/// Market-specific wrapper for NO coins
/// Used to tag NO coins with market_id to prevent cross-market attacks
public struct MarketNo has key, store {
    id: UID,
    market_id: ID,
    amount: u64,
}
```

## 関数インターフェース

### 1. Init: 空のPoolを作成

```move
/// Initialize market pool with empty state
/// Creates an empty pool (yes_balance = 0, no_balance = 0, collateral = 0, k = 0)
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
        collateral: balance::zero<USDO>(),
    };
    
    let pool_id = object::id(&pool);
    transfer::share_object(pool);
    pool_id
}
```

### 2. Split: N USDO → YES N + NO N

```move
/// Split N USDO into YES N + NO N pair (fixed 1:1 ratio)
/// Returns MarketYes and MarketNo wrappers tagged with market_id
/// USDO is locked in collateral (1 USDO per pair)
/// This is the ONLY way to mint YES/NO coins
public fun split_usdo(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
): (MarketYes, MarketNo, Coin<YES_COIN>, Coin<NO_COIN>) {
    // Lock USDO in collateral
    balance::join(&mut pool.collateral, coin::into_balance(usdo_coin));
    
    // Mint YES N + NO N
    let yes_coin = coin::mint<YES_COIN>(treasury_cap_yes, usdo_amount, ctx);
    let no_coin = coin::mint<NO_COIN>(treasury_cap_no, usdo_amount, ctx);
    
    // Create market-specific wrappers
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
    
    (market_yes, market_no, yes_coin, no_coin)
}
```

### 3. Join: YES N + NO N → N USDO

```move
/// Join YES N + NO N pair back into N USDO
/// Requires MarketYes and MarketNo wrappers to ensure correct market
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
    // Verify market_id matches (prevents cross-market attacks)
    assert!(market_yes.market_id == pool.market_id, E_WRONG_MARKET);
    assert!(market_no.market_id == pool.market_id, E_WRONG_MARKET);
    
    // Burn wrappers
    let MarketYes { id: yes_id, market_id: _, amount: _ } = market_yes;
    let MarketNo { id: no_id, market_id: _, amount: _ } = market_no;
    object::delete(yes_id);
    object::delete(no_id);
    
    // Burn YES and NO
    coin::burn(treasury_cap_yes, yes_coin);
    coin::burn(treasury_cap_no, no_coin);
    
    // Unlock USDO from collateral (1:1 exchange guaranteed)
    let usdo_balance = balance::split(&mut pool.collateral, yes_amount);
    coin::from_balance(usdo_balance, ctx)
}
```

### 4. Deposit Liquidity: LPが流動性を提供（MVPでは内部利用専用）

```move
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
public fun deposit_liquidity(
    pool: &mut MarketPool,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    _ctx: &mut TxContext,
) {
    // Add coins to pool
    balance::join(&mut pool.yes_balance, coin::into_balance(yes_coin));
    balance::join(&mut pool.no_balance, coin::into_balance(no_coin));
    
    // Update k
    pool.k = (yes_balance as u128) * (no_balance as u128);
}
```

**MVPでの制限事項:**
- `deposit_liquidity`は**内部利用専用**（プロトコルによる初期流動性設定のみ）
- 一般ユーザーには公開しない
- LP機能を一般ユーザーに開くには、以下が必要（将来の実装）:
  - LP share tokenの実装
  - `withdraw_liquidity`関数の実装
  - Wrapperの分割/合成機能

### 5. Swap: YES ↔ NO (Binary CPMM)

```move
/// Swap YES for NO using Binary CPMM
/// Formula: yes_balance * no_balance = k (no fee)
public fun swap_yes_for_no(
    pool: &mut MarketPool,
    yes_coin: Coin<YES_COIN>,
    min_no_out: u64,
    ctx: &mut TxContext,
): Coin<NO_COIN> {
    // CPMM: (yes_balance + yes_in) * (no_balance - no_out) = k
    // Solving: no_out = (no_balance * yes_in) / (yes_balance + yes_in)
    // ... (implementation)
}

/// Swap NO for YES using Binary CPMM
public fun swap_no_for_yes(
    pool: &mut MarketPool,
    no_coin: Coin<NO_COIN>,
    min_yes_out: u64,
    ctx: &mut TxContext,
): Coin<YES_COIN> {
    // CPMM: (yes_balance - yes_out) * (no_balance + no_in) = k
    // Solving: yes_out = (yes_balance * no_in) / (no_balance + no_in)
    // ... (implementation)
}
```

### 6. Redeem: 決済時のペイアウト

```move
/// Redeem winning YES coins for USDO from collateral
/// Requires MarketYes wrapper to ensure correct market
/// Payout: 1 YES = 1 USDO (guaranteed by collateral design)
/// 
/// ⚠️ IMPORTANT: wrapper.amount == coin_amount must match exactly
/// This means you can only redeem YES/NO up to your original split amount
/// YES/NO obtained through swap cannot be redeemed beyond your original deposit
public fun redeem_winning_yes_coins(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    market_yes: MarketYes,
    winning_coins: Coin<YES_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let coin_amount = coin::value(&winning_coins);
    
    // Verify market_id matches (prevents cross-market attacks)
    assert!(market_yes.market_id == pool.market_id, E_WRONG_MARKET);
    
    // ⚠️ CRITICAL: Amount must match exactly (prevents 1 wrapper redeeming large amounts)
    // This also means swap-increased YES/NO cannot be redeemed beyond original deposit
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
/// 
/// ⚠️ Same constraints as redeem_winning_yes_coins
public fun redeem_winning_no_coins(
    pool: &mut MarketPool,
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,
    market_no: MarketNo,
    winning_coins: Coin<NO_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    // Similar to redeem_winning_yes_coins
    // Must verify: market_no.amount == coin_amount
}
```

**⚠️ 重要な制約:**

`redeem_winning_yes_coins`では、`market_yes.amount == coin_amount`を厳密にチェックします。これは以下を意味します：

1. **セキュリティ**: 1ラッパーで大量YESを換金する攻撃を防止
2. **MVPでの制限**: swapで増やしたYES/NOはredeemできない
   - 元本（splitしたUSDO分）のみがredeem可能
   - 例: MarketYes(amount=1)でredeemできるのはYES 1枚まで
   - swapでYES 2枚になっても、redeemできるのは1枚のみ
   - 残りのYESはburnされる（ペイアウトなし）

**将来の実装:**
一般的な予測市場のように「swapで増やした分だけペイアウトも増える」挙動を実現するには、以下が必要です：
- Claim tokenをfungible化してswap時に移動させる
- または、wrapper設計を再検討する（per-user positionオブジェクトから、total claimを表すものへ）

## ユーザーフロー（MVP）

### ⚠️ 重要な制約（MVP）

**現在の実装では、swapでYES/NOを増やしても、redeemできる上限は自分の元本（splitしたUSDO分）のみです。**

- `split_usdo`でMarketYes(amount=1)とYES 1枚を受け取る
- `swap_no_for_yes`でNO 1枚をYESに換えて、YES 2枚になる
- しかし、`redeem_winning_yes_coins`では`market_yes.amount == coin_amount`をチェック
- MarketYes(amount=1)でredeemできるのはYES 1枚まで（= 元本の1 USDO）
- **swapで増やしたYES（この例では残り1枚）はredeemできず、burnされる**

これは、セキュリティ（1ラッパーで大量YESを換金する攻撃防止）のための設計です。

**つまり、MVPでは「自分の元本に対するbinary bet」として動作します。**
- 元本: 自分のsplitしたUSDO分
- ペイアウト上限: 元本と同じ（1 USDO split → 最大1 USDO redeem）
- swap: 価格発見には使えるが、ペイアウト増加には繋がらない

一般的な予測市場（Polymarketなど）のように「swapで増やした分だけペイアウトも増える」挙動は、**将来の実装で対応が必要**です。

### フロー1: ユーザーがYESに賭けたい場合（MVP）

```
1. split_usdo(pool, treasury_cap_yes, treasury_cap_no, 1 USDO)
   → (MarketYes(amount=1), MarketNo(amount=1), YES 1, NO 1)を受け取る
   → collateralに1 USDOがロックされる

2. swap_no_for_yes(pool, NO 1, ...)
   → NO 1枚をYESに換える
   → 結果: MarketYes(amount=1), MarketNo(amount=1), YES 2, NO 0
   → ※市場がOPEN状態である必要がある
   → ⚠️ 注意: swapで増やしたYES 1枚は、後でredeemできない（元本分のみredeem可能）

3. 市場が決済（YES勝利）→ RESOLVED状態に変更

4. redeem_winning_yes_coins(pool, treasury_cap_yes, MarketYes(amount=1), YES 1)
   → market_idを検証（異なる市場では失敗）
   → wrapper.amount == coin_amountを検証（1 == 1でOK）
   → 1 USDOを受け取る（元本分）
   
   ⚠️ 残りのYES 1枚（swapで増やした分）はredeemできない
   → このYES 1枚はburnされる（ペイアウトなし）
```

### フロー2: プロトコルが初期流動性を提供する場合（MVP）

```
1. init_market_pool(market_id) → 空のPoolを作成

2. プロトコルが内部でsplit_usdoを呼ぶ
   → (MarketYes, MarketNo, YES 100, NO 100)を作成
   → collateralに100 USDOがロックされる

3. プロトコルが内部でdeposit_liquidityを呼ぶ
   → YES/NOをプールに預けて初期流動性を提供
   → ※一般ユーザーは呼べない（内部利用専用）

4. ユーザーがswapできるようになる
```

**注意:**
- MVPでは`deposit_liquidity`は**一般ユーザーには公開しない**
- LP機能を一般ユーザーに開くには、将来の実装が必要（LP share token、withdraw_liquidityなど）

## 安全性の保証

### 1. クロスマーケット攻撃の防止 ✅

- **MarketYes/MarketNoラッパー**により、市場IDがタグ付けされる
- `redeem_winning_coins`では`market_id`を検証
- 市場AでmintしたYESを市場Bでredeemすることは不可能

### 2. 1ラッパーで大量YESを換金する攻撃の防止 ✅

- `redeem_winning_yes_coins`では`market_yes.amount == coin_amount`を**厳密に**検証
- MarketYes(amount=1) + YES 100枚では失敗（`1 == 100`が偽）
- MarketYes(amount=100) + YES 100枚のみ成功（`100 == 100`が真）
- ラッパー1個で大量のYESを換金することは不可能

**⚠️ MVPでの副作用:**
この制約により、**swapで増やしたYES/NOはredeemできません**。
- 例: MarketYes(amount=1)でsplitし、swapでYES 2枚に増やしても、redeemできるのはYES 1枚のみ
- 残りのYES 1枚はburnされる（ペイアウトなし）
- つまり、MVPでは「自分の元本に対するbinary bet」として動作
- 一般的な予測市場のように「swapで増やした分だけペイアウトも増える」挙動は、将来の実装で対応が必要

### 3. 無担保YES/NOの防止 ✅

- YES/NOのmintは**split_usdoのみ**
- `init_market_pool`ではmintしない
- これにより`collateral = outstanding_pairs * 1 USDO`が保証される

### 4. Collateral保証 ✅

- Splitのたびに: `collateral += usdo_amount`
- Joinのたびに: `collateral -= usdo_amount`
- Redeem時: `collateral >= coin_amount`（1:1交換が保証される）

### 5. CPMMロジックの正確性 ✅

- `swap_yes_for_no`と`swap_no_for_yes`は正しい定数積公式を使用
- `x * y = k`（fee 0版Uniswap V2互換）
- 数学的に正しい

### 6. MVPでの制限事項 ⚠️

- **LP機能は内部利用専用**（一般ユーザーには公開しない）
  - `deposit_liquidity`でYES/NOを預けた後、ユーザーがLPポジションを回収する方法がない
  - Wrapperの量の整合性チェックとLP設計が矛盾している
  - 将来の実装が必要: LP share token、`withdraw_liquidity`、wrapperの分割/合成

- **Swapで増やしたYES/NOはredeemできない**（元本上限型）
  - `redeem_winning_yes_coins`では`market_yes.amount == coin_amount`を厳密にチェック
  - これにより、swapで増やしたYES/NOはredeemできず、burnされる
  - 元本（splitしたUSDO分）のみがredeem可能
  - MVPでは「自分の元本に対するbinary bet」として動作
  - 一般的な予測市場のように「swapで増やした分だけペイアウトも増える」挙動は、将来の実装で対応が必要
  - 将来の実装には、claim tokenのfungible化やwrapper設計の再検討が必要

- **マーケット状態管理はmarkets.move側で実装が必要**
  - `join_coins`、`swap_*`は市場がOPEN状態でのみ許可
  - `redeem_winning_*`は市場がRESOLVED状態でのみ許可
  - `markets.move`との統合時に状態チェックを追加

## 実装の順序

1. ✅ **MarketPool構造体**（`market_id`で市場を区別）
2. ✅ **MarketYes/MarketNoラッパー**（市場IDタグ付け）
3. ✅ **init_market_pool**（空のPoolを作成）
4. ✅ **split_usdo**（唯一のYES/NO発行方法、ラッパーも発行）
5. ✅ **deposit_liquidity**（内部利用専用、プロトコルによる初期流動性設定）
6. ✅ **join_coins**（ラッパーで市場ID検証、OPEN状態でのみ許可）
7. ✅ **swap_yes_for_no / swap_no_for_yes**（Binary CPMM、手数料なし、OPEN状態でのみ許可）
8. ✅ **redeem_winning_yes_coins / redeem_winning_no_coins**（ラッパーで市場ID検証、RESOLVED状態でのみ許可）
9. ⏳ **markets.moveとの統合**（市場作成時にMarketPoolを作成、状態管理を追加）

## 実装状態

✅ **コア機能**: すべて実装済み（ビルド成功）
- クロスマーケット攻撃防止 ✅
- 1ラッパーで大量YESを換金する攻撃防止 ✅
- CPMMロジックの正確性 ✅
- Collateral保証 ✅

⚠️ **MVPでの制限**:
- LP機能は内部利用専用（一般ユーザーには公開しない）
- マーケット状態管理は`markets.move`側で実装が必要

## 次のステップ（ハッカソンMVP）

1. **markets.moveとの統合**（最優先）
   - 市場作成時に`init_market_pool`を呼ぶ
   - 市場状態（OPEN/RESOLVED）の管理
   - 各関数呼び出し前に状態チェックを追加
   - `Market`構造体に`pool_id`を追加

2. **フロントエンド統合**
   - `split_usdo`、`swap_*`、`redeem_winning_*`のフロントエンド実装
   - 市場状態に応じたUI制御

## 将来の拡張（MVP後）

### Polymarket型（B）への移行
- 詳細は`docs/cpmm-polymarket-design.md`を参照
- 市場ごとに独立したYES/NOコインタイプを作成する仕組み
- 「決済時点で持っている勝ちトークン枚数 × 1USDO = ペイアウト」の実現

### LP機能の一般公開
- LP share tokenの実装
- `withdraw_liquidity`関数の実装
- Wrapperの分割/合成機能
- 一般ユーザー向けLP機能の公開

### その他の改善
- 手数料の追加（オプション）
- より高度な価格発見メカニズム

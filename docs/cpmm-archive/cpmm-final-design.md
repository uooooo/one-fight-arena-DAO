# CPMM予測市場の最終設計

## 1. 市場ごとのYES/NOコイン設計

### 問題点
- Suiのコインシステムでは、One-Time Witnessパターンでコインタイプを自動生成
- 型パラメータ付きコイン（`YesCoin<MarketId>`）を動的に作成するのは技術的に困難

### 解決策：市場IDで管理する設計（推奨）

**方針:**
- `YES_COIN`/`NO_COIN`は全市場共通のコインタイプとして維持（既存の実装を活用）
- 各市場で**異なるTreasuryCap**を持つ
- `Market`構造体に`yes_treasury_cap_id`と`no_treasury_cap_id`を保存
- 決済時は市場IDとコインタイプの組み合わせで判定

**実装方法:**
1. 市場作成時に`coin::mint`を使ってYES/NOコインをミント
2. その市場専用の`TreasuryCap`を保存（実際には既存のYES_COIN/NO_COINのTreasuryCapを使用）
3. 決済時は市場IDとコインタイプの組み合わせで判定

**注意点:**
- コインタイプ自体は`YES_COIN`/`NO_COIN`のまま
- 市場ごとの区別は`PositionNFT`の`market_id`フィールドで管理
- 決済時は「市場ID + コインタイプ」の組み合わせで勝利判定

**代替案（より厳密）:**
- 市場ごとに完全に独立したコインを作成（`coin::create_currency`で各市場ごとに呼び出し）
- ただし、これは各市場ごとに異なるコインタイプ名が必要（例: `YES_MARKET_0x123`）
- 実装が複雑になるため、MVPでは上記の方法を推奨

## 2. プール構造：2独立プール + Split/Join（Phase 1では省略）

### 設計方針

**Phase 1（MVP）: 2独立プール（Split/Joinなし）**
- `Pool<YES_COIN, USDO>` と `Pool<NO_COIN, USDO>` を独立して作成
- `P_yes + P_no = 1` は保証しない（表示時に正規化）
- 実装がシンプルで速い

**Phase 2（改善）: Split/Join機能追加**
- `split(1 USDO) -> (1 YES, 1 NO)` を実装
- `join(1 YES, 1 NO) -> 1 USDO` を実装
- アービトラージで `P_yes + P_no ≈ 1` を保証

**決定: Phase 1を実装（MVP優先）**

### Split/Join機能の設計（将来）

```move
/// Split 1 USDO into (1 YES, 1 NO)
/// This ensures P_yes + P_no ≈ 1 through arbitrage
public fun split_usdo<MarketId>(
    market: &Market<MarketId>,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
): (Coin<YES_COIN>, Coin<NO_COIN>) {
    // 1. 1 USDOを受け取る
    // 2. TreasuryCapを使って1 YESと1 NOをミント
    // 3. ユーザーに返す
}

/// Join (1 YES, 1 NO) into 1 USDO
public fun join_coins<MarketId>(
    market: &Market<MarketId>,
    yes_coin: Coin<YES_COIN>,
    no_coin: Coin<NO_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    // 1. 1 YESと1 NOを受け取る
    // 2. コインをバーン
    // 3. 1 USDOをミントして返す
}
```

## 3. オッズ計算式（修正版）

### 正しい計算方法

```move
/// Get YES price in USDO
/// Returns price = USDO_reserve / YES_reserve
public fun get_yes_price_in_usdo<MarketId>(
    market: &Market<MarketId>,
): u64 {
    let (yes_balance, usdo_balance) = get_pool_balances(&market.yes_pool);
    if (yes_balance == 0) {
        return 0
    };
    // Price = USDO / YES (in base units, need to handle decimals)
    (usdo_balance * 10^9) / yes_balance  // Assuming 9 decimals
}

/// Get NO price in USDO
/// Returns price = USDO_reserve / NO_reserve
public fun get_no_price_in_usdo<MarketId>(
    market: &Market<MarketId>,
): u64 {
    let (no_balance, usdo_balance) = get_pool_balances(&market.no_pool);
    if (no_balance == 0) {
        return 0
    };
    (usdo_balance * 10^9) / no_balance
}
```

### フロントエンド側での正規化

```typescript
// Get raw prices
const yesPriceRaw = getYesPriceInUSDO(market); // e.g., 0.55 USDO per YES
const noPriceRaw = getNoPriceInUSDO(market);   // e.g., 0.45 USDO per NO

// Convert to probabilities (inverse of price)
const pYesRaw = 1 / yesPriceRaw; // e.g., 1 / 0.55 = 1.818
const pNoRaw = 1 / noPriceRaw;   // e.g., 1 / 0.45 = 2.222

// Normalize so that pYes + pNo = 1
const pYes = pYesRaw / (pYesRaw + pNoRaw); // e.g., 1.818 / 4.04 = 0.45 (45%)
const pNo = pNoRaw / (pYesRaw + pNoRaw);   // e.g., 2.222 / 4.04 = 0.55 (55%)

// Display as odds
const yesOdds = 1 / pYes; // e.g., 1 / 0.45 = 2.22x
const noOdds = 1 / pNo;   // e.g., 1 / 0.55 = 1.82x
```

## 4. 決済時の原資設計

### 設計案：プールベースの決済（推奨）

**フロー:**
1. 市場作成時に初期流動性を提供（例: 1000 YES, 1000 NO, 2000 USDO）
2. 取引によりプール内のUSDO/YES/NOの構成が変わる
3. 決済時: 勝った側のプールからUSDOを分配

**決済ロジック:**
```move
/// Redeem winning coins for USDO from pool
/// Payout = min(pool_USDO_balance, winning_coins_total * 1 USDO)
/// If pool has less USDO than needed, distribute proportionally
public fun redeem_winning_coins<WinningCoinType>(
    market: &mut Market,
    yes_pool: &mut Pool<YES_COIN, USDO>,
    no_pool: &mut Pool<NO_COIN, USDO>,
    winning_coins: Coin<WinningCoinType>,
    ctx: &mut TxContext,
): Coin<USDO> {
    assert!(market.state == RESOLVED, E_MARKET_NOT_RESOLVED);
    
    let coin_amount = coin::value(&winning_coins);
    
    // Determine which pool to use
    let pool = if (market.winning_coin_type == YES) {
        yes_pool
    } else {
        no_pool
    };
    
    // Get pool balances
    let (coin_balance, usdo_balance) = get_pool_balances(pool);
    
    // Calculate payout (proportional if pool doesn't have enough)
    let payout_amount = if (coin_balance == 0) {
        0
    } else {
        // Payout = min(coin_amount * usdo_balance / coin_balance, coin_amount * 1 USDO)
        let proportional_payout = (coin_amount * usdo_balance) / coin_balance;
        let max_payout = coin_amount; // 1:1 exchange
        if (proportional_payout < max_payout) {
            proportional_payout
        } else {
            max_payout
        }
    };
    
    // Extract USDO from pool
    let (coin_balance_out, usdo_balance_out) = remove_liquidity(
        pool,
        coin_amount, // Remove winning coins
        payout_amount, // Get USDO
        ctx,
    );
    
    // Burn winning coins (or transfer to treasury)
    // For now, we'll burn them
    let coin_balance_val = balance::value(&coin_balance_out);
    // Burn coins using TreasuryCap
    
    usdo_balance_out
}
```

## 5. Market構造体の拡張

```move
public struct Market has key {
    id: UID,
    event_id: ID,
    question: vector<u8>,
    state: u8,
    winning_coin_type: Option<vector<u8>>,
    fee_bps: u64,
    vault_address: address,
    
    // CPMM pools
    yes_pool_id: ID,  // Pool<YES_COIN, USDO>
    no_pool_id: ID,   // Pool<NO_COIN, USDO>
    
    // Treasury caps for minting/burning coins
    yes_treasury_cap_id: ID,  // TreasuryCap<YES_COIN>
    no_treasury_cap_id: ID,   // TreasuryCap<NO_COIN>
}
```

## 6. 実装の順序

### Phase 1: 最小限の動作する実装

1. ✅ **USDOトークン実装**（完了）
2. ✅ **CPMM基本ロジック実装**（完了、手数料ロジックも正しく実装済み）
3. **Market構造体の拡張**（yes_pool_id, no_pool_id, treasury_cap_id追加）
4. **市場作成時のCPMMプール作成**
   - YES/USDOプールの作成と初期流動性の提供
   - NO/USDOプールの作成と初期流動性の提供
   - TreasuryCapの保存
5. **決済ロジックの実装**
   - 勝った側のプールからUSDOを分配（比例配分）
6. **オッズ計算関数の追加**（フロントエンド側で正規化）

### Phase 2: 改善（時間があれば）

- Split/Join機能の追加（P_yes + P_no ≈ 1を保証）
- Collateralプールの実装（完全な1:1保証）
- より高度な価格形成メカニズム

## 7. 重要な修正点のまとめ

### ✅ 既に正しい実装
- 手数料ロジック（Uniswap V2スタイル、kが増える）
- CPMMの基本計算式

### 🔄 修正が必要
1. **オッズ計算式**: 他方のプールのUSDO残高を使う誤りを修正
2. **市場ごとのコイン管理**: TreasuryCapと市場IDの組み合わせで管理
3. **決済ロジック**: プールベースの比例配分に変更
4. **Market構造体**: プールIDとTreasuryCap IDを追加

### ⏭️ Phase 2で実装
- Split/Join機能（P_yes + P_no ≈ 1を保証）


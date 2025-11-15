# CPMM予測市場のPolymarket型（B）設計案

## 設計方針の変更

### 現在の問題（元本上限型 A）
- MarketYes/MarketNoラッパーが`amount`を持ち、`amount == coin_amount`をチェック
- swapで増やしたYES/NOはredeemできない
- 元本（splitしたUSDO分）のみがredeem可能

### Polymarket型（B）の要件
- **決済時点で持っている勝ちトークン枚数 × 1USDO = ペイアウト**
- YES/NOの出所（自分でmintしたもの、swapで増やしたもの、他人から買ったもの）に関係なく、全て1:1でredeem可能
- 「安くYESを集めた人」が最終的に大きく儲かる

## 実装アプローチ

### アプローチ1: 市場ごとに独立したYES/NOコインタイプ（推奨）

**アイデア:**
- 各市場で独立したYES/NOコインを作成（`coin::create_currency`で各市場ごとに呼び出し）
- YES/NOコイン自体が市場を識別（型レベルで分離）
- ラッパーは不要（または市場IDの検証用のみ）

**実装:**
```move
// 市場作成時に、その市場専用のYES/NOコインを作成
// YES_COIN_MARKET_0x123, NO_COIN_MARKET_0x123 のように市場ごとに異なるコインタイプ
// これにより、型レベルで市場を区別できる

public fun create_market_with_coins(
    admin_cap: &ProtocolAdminCap,
    market_id: ID,
    ...
) {
    // 市場ごとに独立したYES/NOコインを作成
    let yes_treasury = coin::create_currency<YES_COIN_MARKET_X>(...);
    let no_treasury = coin::create_currency<NO_COIN_MARKET_X>(...);
    ...
}

// redeem時は、コインタイプ自体が市場を識別しているので、
// ラッパーの`amount == coin_amount`チェックは不要
public fun redeem_winning_coins<CoinType>(
    pool: &mut MarketPool<CoinType>,
    winning_coins: Coin<CoinType>,
    ...
): Coin<USDO> {
    // market_idのチェックは不要（型レベルで保証されている）
    // amountのチェックも不要（持っている枚数だけredeem可能）
    let coin_amount = coin::value(&winning_coins);
    coin::burn(winning_coins);
    // collateralから1:1で払い出す
    let usdo_balance = balance::split(&mut pool.collateral, coin_amount);
    coin::from_balance(usdo_balance, ctx)
}
```

**メリット:**
- 型レベルで市場を区別（cross-market攻撃を完全に防止）
- ラッパーの`amount`チェックが不要（持っている枚数だけredeem可能）
- Polymarket型の挙動を実現

**デメリット:**
- 各市場で異なるコインタイプを作成する必要がある（動的な型生成が難しい）
- `MarketPool`も型パラメータ付きにする必要がある

### アプローチ2: Fungible Claim Token（複雑）

**アイデア:**
- YES/NOコインとは別に、Claim Token（請求権）をfungibleに発行
- swap時に、YES/NOと一緒にClaim Tokenも移動
- redeem時は、Claim Tokenの枚数だけredeem可能

**実装:**
```move
// Claim Token（市場ごと）
public struct ClaimToken has key, store {
    id: UID,
    market_id: ID,
}

// split時に、YES/NOとClaim Tokenを同時に発行
// swap時に、YES/NOとClaim Tokenを一緒に移動
// redeem時は、Claim Tokenの枚数だけredeem可能
```

**メリット:**
- YES/NOコインは共通型のまま維持可能

**デメリット:**
- 実装が複雑（swap時にYES/NOとClaim Tokenを一緒に移動する必要がある）
- ハッカソンMVPには過剰

### アプローチ3: ラッパーを削除し、YES/NOコイン自体が市場を識別（簡易版）

**アイデア:**
- MarketYes/MarketNoラッパーを削除
- `redeem_winning_coins`では、`pool.market_id`を検証するだけ
- `amount == coin_amount`チェックを削除（持っている枚数だけredeem可能）

**実装:**
```move
// ラッパーなしでredeem
public fun redeem_winning_yes_coins(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,
    winning_coins: Coin<YES_COIN>,
    ctx: &mut TxContext,
): Coin<USDO> {
    let coin_amount = coin::value(&winning_coins);
    assert!(coin_amount > 0, E_INVALID_AMOUNT);
    
    // market_idの検証は不要（poolが既にmarket_idを持っている）
    // amountのチェックも不要（持っている枚数だけredeem可能）
    
    // Burn winning YES coins
    coin::burn(treasury_cap_yes, winning_coins);
    
    // Pay out from collateral (1:1 exchange guaranteed)
    let collateral_balance = balance::split(&mut pool.collateral, coin_amount);
    coin::from_balance(collateral_balance, ctx)
}
```

**問題点:**
- Cross-market攻撃を防げない（市場AのYESを市場Bでredeemできてしまう）
- `YES_COIN`は共通型なので、市場を識別できない

## 推奨実装：アプローチ1（市場ごとに独立したコインタイプ）

ハッカソンMVPとしては、アプローチ1が最もシンプルで確実です。

**変更点:**
1. 市場作成時に、その市場専用のYES/NOコインを作成
2. `MarketPool`を型パラメータ付きに変更（`MarketPool<YES_COIN_MARKET_X, NO_COIN_MARKET_X>`）
3. `MarketYes/MarketNo`ラッパーを削除（または市場ID検証用のみに変更）
4. `redeem_winning_coins`で`amount == coin_amount`チェックを削除

**ただし、動的な型生成はMoveでは困難なので:**
- 各市場で異なるモジュールを作成する必要がある
- または、`coin::create_currency`を各市場ごとに呼び出し（これも型の動的生成が必要）

**実用的な妥協案:**
- Suiでは動的な型生成が難しいため、市場ごとに異なるパッケージをデプロイする
- または、市場IDをコインメタデータに保存し、redeem時に検証する

## 実装の優先順位

1. **ハッカソンMVP**: 現在の実装（元本上限型 A）で進める
   - セキュリティが確保されている
   - 実装が完了している
   - Polymarket型への変更は将来の実装とする

2. **将来の実装**: Polymarket型（B）への移行
   - 市場ごとに独立したコインタイプを作成する仕組みを検討
   - または、claim tokenのfungible化を実装


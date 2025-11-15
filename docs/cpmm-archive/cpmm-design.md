# CPMMベース予測市場の設計

## 概要

DeepBookからCPMM（Constant Product Market Maker）ベースの予測市場に変更。
USDO（USDOne token）を基準通貨として使用し、YES/NOコインの取引を行う。

## アーキテクチャ

### 1. トークン設計

- **USDO**: USDOne token（基準通貨）
  - 9 decimals
  - One-Time Witnessパターンでinit時に自動生成
  - TreasuryCapはパッケージ発行者に転送

- **YES_COIN**: 予測市場のYESオプション
  - 9 decimals
  - One-Time Witnessパターンでinit時に自動生成
  - 各市場で独立して使用（市場ごとに異なるYES_COINは使用しない）

- **NO_COIN**: 予測市場のNOオプション
  - 9 decimals
  - One-Time Witnessパターンでinit時に自動生成
  - 各市場で独立して使用（市場ごとに異なるNO_COINは使用しない）

### 2. CPMMプール設計

各市場には2つのCPMMプールがある：

1. **YESプール**: YES_COIN/USDO ペア
2. **NOプール**: NO_COIN/USDO ペア

各プールは `x * y = k` の公式に基づく：
- `x`: YES_COINまたはNO_COINの数量
- `y`: USDOの数量
- `k`: 一定積（定数）

### 3. 取引フロー

#### 3.1 YESコインの購入（USDOで支払い）

```
USDO → YES_COIN
プール: YES_COIN/USDO

計算:
- プール状態: x YES_COIN, y USDO
- ユーザーが投入するUSDO: Δy
- 得られるYES_COIN: Δx
- 公式: (x + Δx) * (y + Δy) = k
- 手数料: fee_bps (例: 500 = 5%)
- 実際の計算: (x + Δx) * (y + (1 - fee_bps/10000) * Δy) = x * y
```

#### 3.2 NOコインの購入（USDOで支払い）

```
USDO → NO_COIN
プール: NO_COIN/USDO

計算はYESと同じロジック
```

#### 3.3 YES/NOコインの売却（USDOを受け取る）

```
YES_COIN → USDO または NO_COIN → USDO
逆方向の交換（同じ公式を使用）
```

### 4. オッズ計算

CPMMベースのオッズは以下のように計算：

```
YES_odds = (NO_COIN_balance + YES_COIN_balance) / YES_COIN_balance
NO_odds = (NO_COIN_balance + YES_COIN_balance) / NO_COIN_balance
```

または、より正確には：

```
YES_price_in_USDO = NO_COIN_pool_USDO / YES_COIN_pool_balance
NO_price_in_USDO = YES_COIN_pool_USDO / NO_COIN_pool_balance

YES_odds = 1 / YES_price_in_USDO
NO_odds = 1 / NO_price_in_USDO
```

### 5. 流動性提供

初期流動性は市場作成時に提供される：

```
初期状態:
- YESプール: 1000 YES_COIN, 1000 USDO
- NOプール: 1000 NO_COIN, 1000 USDO

これにより初期オッズは約1:1（各50%）
```

### 6. 清算ロジック

市場決済時：

1. 市場を`RESOLVED`状態に変更
2. 勝った側のコイン（YESまたはNO）をUSDOに交換可能にする
3. 負けた側のコインは無価値になる
4. 手数料（fee_bps）をSupportVaultに送金

```
例: YESが勝った場合
1. YES_COIN保有者は、YES_COINをUSDOに1:1で交換可能
2. NO_COIN保有者は何も得られない
3. プールのUSDOから手数料を徴収してVaultに送金
```

### 7. 手数料

- **取引手数料**: 各取引に`fee_bps`（例: 500 = 5%）を適用
- **清算時手数料**: プールのUSDO残高から一定%をVaultに送金

## Moveモジュール構造

### `usdo_coin.move`
- USDOトークンの定義
- One-Time Witnessパターンでinit時に自動生成

### `cpmm.move`
- CPMMプールの管理
- `Pool<CoinType>`構造体
- `add_liquidity`, `remove_liquidity`, `swap`関数
- 価格計算ロジック

### `markets.move`（更新）
- CPMMプールとの統合
- 市場ごとにYES/NOプールを作成
- 清算時の処理を更新

## 実装の優先順位

1. **USDOトークン実装**（最優先）
2. **CPMM基本ロジック実装**（x * y = k、swap計算）
3. **市場とCPMMプールの統合**
4. **清算ロジックの実装**
5. **フロントエンド統合**


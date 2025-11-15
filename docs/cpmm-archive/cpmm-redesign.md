# CPMM予測市場の再設計

## 指摘事項の整理と修正方針

### 1. トークン設計：市場ごとにYES/NOを分ける

**問題点:**
- 現在: 全市場共通のYES_COIN/NO_COINを使用
- 結果: 決済時に「どの市場のYESなのか」が区別できない

**修正方針:**
- 市場ごとに独立したYES/NOトークンを作成
- Moveの型パラメータを使用: `YesCoin<MarketId>`, `NoCoin<MarketId>`
- または、市場IDを含む構造体として定義

### 2. プール構造：2独立プール vs 統合設計

**現在の設計:**
- プール1: `YES/USDO`
- プール2: `NO/USDO`
- **問題**: `P_yes + P_no = 1` が保証されない

**選択肢A: 2プール + Split/Join機能**
- `split(1 USDO) -> (1 YES, 1 NO)` を実装
- `join(1 YES, 1 NO) -> 1 USDO` を実装
- アービトラージで `P_yes + P_no ≈ 1` に近づける

**選択肢B: 単一プール（Binary CPMM / LMSR型）**
- 1つのプールでYES/NO/USDOを管理
- `k = YES_balance * NO_balance * USDO_balance` のような3変数モデル
- または、`YES_balance * NO_balance = k` でUSDOは外部から供給

**推奨: 選択肢A（2プール + Split/Join）**
- 実装が比較的シンプル
- CPMMの標準的な理解に近い
- アービトラージで価格整合性を保つ

### 3. オッズ計算式の修正

**間違っていた計算:**
```
YES_price_in_USDO = NO_COIN_pool_USDO / YES_COIN_pool_balance  ❌
```

**正しい計算:**
```
YES_price_in_USDO = YES_pool_USDO / YES_pool_YES_balance
NO_price_in_USDO  = NO_pool_USDO  / NO_pool_NO_balance
```

**正規化（P_yes + P_no = 1にする）:**
```
p_yes_raw = 1 / YES_price_in_USDO
p_no_raw  = 1 / NO_price_in_USDO

p_yes = p_yes_raw / (p_yes_raw + p_no_raw)
p_no  = p_no_raw  / (p_yes_raw + p_no_raw)
```

### 4. 手数料ロジック（既に正しく実装済み）

現在の実装はUniswap V2スタイルで正しい:
- 入力に手数料を適用: `fee_factor = 10000 - fee_bps`
- kはfee分だけ増加する（LPが手数料を享受）

### 5. 決済時の原資設計

**問題:**
- 「1 YES = 1 USDO」で払いたいが、原資となるUSDOがどこにロックされているか不明

**設計案:**

#### 設計案A: プールにUSDOをロック
1. 市場作成時に初期流動性を提供（例: 1000 YES, 1000 NO, 2000 USDO）
2. 取引によりプール内のUSDO/YES/NOの構成が変わる
3. 決済時: 勝った側のプールからUSDOを分配

**問題点:**
- プール内のUSDO量 = YES保有者への支払い可能額
- 「1:1交換」は保証されない（プール残高次第）

#### 設計案B: 別途Collateralプール
1. 市場作成時にCollateralを別途ロック（例: 1 YES に対して 1 USDO）
2. CPMMプールは価格形成のみに使用
3. 決済時: Collateralプールから1:1で支払い

**推奨: 設計案A（簡易版）**
- 決済時の支払い額 = `min(プール残高, 勝利コイン総数 * 1 USDO)`
- 完全な1:1は保証しない（流動性が足りない場合は比例配分）
- MVPとしてはシンプルで実装しやすい

### 6. 実装方針の決定

#### Phase 1: 最小限の動作する実装

1. **市場ごとのYES/NOコイン**
   - `struct YesCoin<phantom MarketId>` のような型パラメータ付き設計
   - 市場作成時にその市場専用のYES/NOコインをミント

2. **2つの独立CPMMプール**
   - `Pool<YesCoin<MarketId>, USDO>`
   - `Pool<NoCoin<MarketId>, USDO>`
   - Split/JoinはPhase 2（オプション）

3. **正しいオッズ計算**
   - 各プールのUSDO/コイン残高から価格を計算
   - フロントエンドで正規化して表示

4. **決済ロジック**
   - 勝った側のプールからUSDOを分配
   - 完全な1:1は保証せず、プール残高ベースで分配

#### Phase 2: 改善（時間があれば）

- Split/Join機能の追加（P_yes + P_no ≈ 1を保証）
- Collateralプールの実装（完全な1:1保証）
- より高度な価格形成メカニズム

## 次のステップ

1. Moveモジュールの設計を市場ごとのYES/NOに変更
2. `markets.move`にCPMMプール作成ロジックを追加
3. Split/Join機能の設計（Phase 1では省略可能）
4. 決済ロジックの実装（プール残高ベース）


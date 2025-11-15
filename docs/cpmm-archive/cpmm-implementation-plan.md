# CPMM予測市場の実装計画（修正版）

## 設計方針の決定

### 1. 市場ごとのYES/NOコイン設計

**課題:**
- Suiのコインシステムでは、One-Time Witnessパターンでコインタイプを自動生成
- 型パラメータ付きコイン（`YesCoin<MarketId>`）を動的に作成するのは困難

**解決策A: 市場ごとにコイン作成関数を呼び出す**
- 市場作成時に、その市場専用のYES/NOコインを`coin::create_currency`で作成
- 各市場で異なる`TreasuryCap`を持つ
- コインタイプ自体は`YES_COIN`/`NO_COIN`だが、市場IDで区別（型安全性は低い）

**解決策B: 市場IDを含むコイン構造体（推奨）**
- `YES_COIN`/`NO_COIN`はそのまま使用
- `Market`構造体に`yes_treasury_cap_id`と`no_treasury_cap_id`を保存
- 決済時は市場IDとコインタイプの組み合わせで判定

**解決策C: 市場IDをコインメタデータに含める**
- コイン作成時に市場IDをメタデータに保存
- 決済時にメタデータから市場IDを読み取る

**推奨: 解決策B（実装がシンプルで型安全性とのバランスが良い）**

### 2. プール構造とSplit/Join機能

**Phase 1（MVP）: 2独立プール（Split/Joinなし）**
- `Pool<YES_COIN, USDO>` と `Pool<NO_COIN, USDO>` を独立して作成
- `P_yes + P_no = 1` は保証しない（表示時に正規化）
- 実装がシンプル

**Phase 2（改善）: Split/Join機能追加**
- `split(1 USDO) -> (1 YES, 1 NO)` を実装
- `join(1 YES, 1 NO) -> 1 USDO` を実装
- アービトラージで `P_yes + P_no ≈ 1` を保証

**決定: Phase 1（MVP）を実装**

### 3. オッズ計算式の修正

**正しい計算:**
```move
// 各プールから価格を取得
YES_price = YES_pool_USDO / YES_pool_YES_balance
NO_price  = NO_pool_USDO  / NO_pool_NO_balance

// 正規化して確率を計算（フロントエンド側）
p_yes_raw = 1 / YES_price
p_no_raw  = 1 / NO_price
p_yes = p_yes_raw / (p_yes_raw + p_no_raw)
p_no  = p_no_raw  / (p_yes_raw + p_no_raw)
```

### 4. 決済時の原資設計

**設計案: プールベースの決済（推奨）**
1. 市場作成時に初期流動性を提供（例: 1000 YES, 1000 NO, 2000 USDO）
2. 取引によりプール内のUSDO/YES/NOの構成が変わる
3. 決済時: 勝った側のプールからUSDOを分配
   - 分配額 = `min(プールUSDO残高, 勝利コイン総数 * 1 USDO)`
   - 完全な1:1は保証しない（流動性が足りない場合は比例配分）

### 5. 実装の順序

1. **市場ごとのYES/NOコイン作成ロジック**
   - `markets.move`に`create_market_coins`関数を追加
   - 市場作成時にYES/NOコインをミントし、`TreasuryCap`を保存

2. **Market構造体の拡張**
   - `yes_pool_id: ID`
   - `no_pool_id: ID`
   - `yes_treasury_cap_id: Option<ID>`
   - `no_treasury_cap_id: Option<ID>`

3. **市場作成時のCPMMプール作成**
   - YES/USDOプールの作成
   - NO/USDOプールの作成
   - 初期流動性の提供

4. **決済ロジックの実装**
   - 勝った側のプールからUSDOを分配
   - 比例配分での支払い

5. **オッズ計算関数の追加**
   - 各プールの残高から価格を計算
   - フロントエンドで正規化

## 次のステップ

1. `markets.move`を更新して市場ごとのコイン作成とCPMMプール作成を統合
2. 決済ロジックを実装
3. フロントエンド統合


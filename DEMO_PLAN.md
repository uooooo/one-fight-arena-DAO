# デモ動画撮影用実装プラン

**目標**: デモ動画を撮影できる状態にするため、モックから実際のSuiチェーン連携へ移行する

**現在の状態**: モックデータを使用しており、トランザクション実行時に「Missing required fields: account, transaction, or chain」エラーが発生

---

## 🎯 デモ動画に必要な最小限の機能

### 必須（デモに必要）
1. ✅ **SupportVaultへの入金** - 既に動作している（`support-tab.tsx`）
2. ✅ **SupporterNFTのミント** - 既に動作している
3. ❌ **Marketデータの実際の取得** - 未実装（モック使用中）
4. ❌ **Market作成時のDeepBookプール・YES/NOコイン作成** - 未実装
5. ❌ **Marketページでの実際のトランザクション実行** - エラー中

### オプション（デモにあったら良い）
- オーダーブックの実際のデータ表示
- 市場決済のUI

---

## 📋 優先度別タスクリスト

### 🔴 最優先（デモに必須）

#### タスク1: MarketオブジェクトをSuiから取得する機能実装
**問題**: 現在モックデータを使用しており、実際のMarketオブジェクトが取得できていない

**実装内容**:
- [ ] `app/src/lib/sui/queries.ts`を作成（または既存を拡張）
- [ ] `getMarket(marketId: string)`関数を実装
  - SuiからMarketオブジェクトを取得
  - `question`, `state`, `event_id`などをパース
- [ ] `getMarketsByEvent(eventId: string)`関数を実装
  - イベントIDに紐づく全Marketを取得

**関連ファイル**:
- `app/src/lib/sui/queries.ts`（新規作成または拡張）
- `app/src/components/market/markets-tab.tsx`（モックデータを実際のデータに置換）

**見積もり**: 2-3時間

---

#### タスク2: Market作成時にDeepBookプールとYES/NOコインを作成
**問題**: Market作成時にDeepBookプールとYES/NOコインが作成されていないため、取引できない

**実装内容**:
- [ ] シードスクリプトを拡張して、Market作成時に以下を実行:
  1. YES/NOコインの作成（One-Time Witnessパターン）
  2. DeepBookプールの作成
  3. Marketオブジェクトへの参照を保存（オプション）
- [ ] または、フロントエンドのMarket作成UIで統合トランザクションを実行

**関連ファイル**:
- `scripts/seed-data.ts`（拡張）
- または `app/src/lib/sui/transactions.ts`（Market作成トランザクションを拡張）

**見積もり**: 3-4時間

---

#### タスク3: Marketページで実際のMarketデータを表示・使用
**問題**: `app/src/app/market/[id]/page.tsx`でモックデータを使用しており、実際のMarket IDが使われていない

**実装内容**:
- [ ] `app/src/app/market/[id]/page.tsx`を修正
  - `params.id`から実際のMarket IDを取得
  - `getMarket()`関数でMarketオブジェクトを取得
  - Marketオブジェクトから`poolId`, `yesCoinType`, `noCoinType`を取得
  - これらの値を`PlaceOrder`コンポーネントに渡す
- [ ] `MarketsTab`コンポーネントも同様に修正

**関連ファイル**:
- `app/src/app/market/[id]/page.tsx`
- `app/src/components/market/markets-tab.tsx`

**見積もり**: 2-3時間

---

#### タスク4: YES/NOコインタイプとDeepBookプールIDの保存・取得
**問題**: Market作成時にYES/NOコインとDeepBookプールが作成されるが、そのIDがどこにも保存されていない

**実装内容**:
- [ ] オプション1: Marketオブジェクトにメタデータとして保存（Move変更必要）
- [ ] オプション2: SEED_DATA.jsonに追加して保存（簡単）
- [ ] オプション3: Dynamic Fieldを使用してMarketオブジェクトに関連付ける（中間）

**推奨**: オプション2（SEED_DATA.json）で最小実装、後でオプション3に移行

**関連ファイル**:
- `scripts/seed-data.ts`（プールIDとコインタイプを保存）
- `SEED_DATA.json`（データ構造拡張）
- `app/src/lib/sui/queries.ts`（取得関数）

**見積もり**: 1-2時間

---

### 🟡 中優先（デモの質を上げる）

#### タスク5: エラーハンドリングの改善
**問題**: 「Missing required fields: account, transaction, or chain」エラーの原因を特定・修正

**実装内容**:
- [ ] `placeBetTx`関数の引数チェックを追加
- [ ] DeepBook API呼び出しの引数を確認
- [ ] ウォレット接続状態の確認を強化
- [ ] エラーメッセージを日本語化

**見積もり**: 1-2時間

---

#### タスク6: 実際のオーダーブックデータ取得（オプション）
**問題**: オーダーブックが空のデータを返している

**実装内容**:
- [ ] DeepBook APIを正しく使用するように修正
- [ ] または、DeepBookのView関数を使用してデータを取得

**見積もり**: 2-3時間（DeepBook API調査含む）

---

### 🟢 低優先（デモ後に実装）

- 市場決済UI
- 勝利コイン償還UI
- リアルタイムデータ更新

---

## 🔧 実装手順（推奨順序）

### Phase 1: データ取得基盤（2-3時間）
1. ✅ `app/src/lib/sui/queries.ts`を作成
2. ✅ `getMarket()`関数を実装してテスト
3. ✅ `getMarketsByEvent()`関数を実装

### Phase 2: Market作成の完全実装（3-4時間）
1. ✅ `scripts/seed-data.ts`を拡張
   - YES/NOコイン作成を追加
   - DeepBookプール作成を追加
   - プールIDとコインタイプをSEED_DATA.jsonに保存
2. ✅ Testnetで再シード実行

### Phase 3: フロントエンド統合（2-3時間）
1. ✅ `markets-tab.tsx`を修正して実際のデータを使用
2. ✅ `app/market/[id]/page.tsx`を修正して実際のデータを使用
3. ✅ `PlaceOrder`コンポーネントに正しいデータを渡す

### Phase 4: エラー修正・テスト（1-2時間）
1. ✅ トランザクション実行エラーを修正
2. ✅ エンドツーエンドテスト
3. ✅ デモ動画撮影

**合計見積もり**: 8-12時間

---

## 🐛 現在のエラー解決

### 「Missing required fields: account, transaction, or chain」

**原因候補**:
1. `signAndExecuteTransactionBlock`が正しく取得できていない
2. `Transaction`オブジェクトが正しく構築されていない
3. ウォレット接続状態が正しくチェックされていない

**確認ポイント**:
- `app/src/app/market/[id]/page.tsx`の`useWalletKit`呼び出し
- `signAndExecuteTransactionBlock`の存在確認
- `Transaction`オブジェクトの構築

---

## 📝 実装時の注意事項

1. **Moveパッケージの変更は最小限に**: 既にTestnetにデプロイ済みなので、新機能追加は慎重に
2. **SEED_DATA.jsonを活用**: 一時的な解決策として、シードデータに必要なIDを保存
3. **エラーハンドリング**: 実際のチェーン連携ではエラーが多発するので、ユーザーフレンドリーなメッセージを表示
4. **デモフロー**: デモ動画で流れるように、一連の操作がスムーズに実行できることを確認

---

## ✅ チェックリスト

### デモ動画撮影前の確認事項
- [ ] SupportVaultへの入金が動作する
- [ ] SupporterNFTのミントが動作する
- [ ] Marketページで実際のMarketデータが表示される
- [ ] Marketページで実際のトランザクションが実行される（エラーなし）
- [ ] ウォレット接続が正常に動作する
- [ ] エラーメッセージが分かりやすい
- [ ] デモフローがスムーズ（所要時間: 2-3分以内）

---

**次のステップ**: タスク1から順番に実装を開始する


# デプロイ状況

## 現在の状況

新しいMoveコード（TreasuryCapをMarketPoolに保存する設計）のデプロイを準備中です。

### 完了した作業

1. ✅ Moveコードの修正
   - MarketPoolにTreasuryCapフィールドを追加
   - `split_usdo_for_market`関数からTreasuryCap引数を削除
   - `create_market`関数にTreasuryCap引数を追加

2. ✅ TypeScript側の修正
   - `splitUsdoForMarketTx`関数からTreasuryCap引数を削除
   - `createMarketTx`関数にTreasuryCap引数を追加
   - `cpmm-trade.tsx`コンポーネントを更新

3. ✅ テストコードの修正
   - `create_test_market`関数のシグネチャを更新
   - テスト用TreasuryCap作成ヘルパーを追加
   - 全テストが成功

### 残りの作業

1. ⏳ Moveコードのデプロイ
   - 現在、ガス不足のためデプロイできていません
   - テストネットのアカウントに十分なSUIが必要（最低0.2 SUI推奨）

2. ⏳ デプロイ後の更新
   - 新しいパッケージIDを`PACKAGE_ID.txt`に保存
   - `SEED_DATA.json`を更新
   - 環境変数ファイルを更新

3. ⏳ 新しいMarketの作成
   - TreasuryCapをMarketPoolに転送する新しい設計を使用
   - 既存のMarketは移行できないため、新しいMarketを作成する必要がある

## デプロイ手順

### 1. ガスの確認と取得

```bash
# 現在のガス残高を確認
sui client gas

# ガスが不足している場合、ファウセットから取得
sui client faucet
```

### 2. デプロイの実行

```bash
# デプロイスクリプトを実行
bun run scripts/deploy-package.ts testnet
```

### 3. デプロイ後の確認

デプロイが成功すると、以下のファイルが自動的に更新されます：
- `move/open_corner/PACKAGE_ID.txt`
- `move/open_corner/README.md`
- `app/.env.example` (存在する場合)

### 4. 手動での更新が必要なファイル

- `app/public/SEED_DATA.json`
- `SEED_DATA.json` (ルート)
- `.env.local` (存在する場合)

## 注意事項

- **既存のMarketは移行できません**: 新しい設計では、MarketPoolにTreasuryCapが保存されますが、既存のMarketPoolにはこのフィールドがありません。新しいMarketを作成する必要があります。

- **TreasuryCapの所有権**: 新しいMarketを作成する際は、TreasuryCap<YES_COIN>とTreasuryCap<NO_COIN>を所有している必要があります。これらのTreasuryCapは、パッケージ公開時にパッケージ公開者に転送されます。

- **ガス要件**: パッケージ公開には最低0.2 SUIのガスが必要です。デプロイ前に十分なガスがあることを確認してください。


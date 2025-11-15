# デプロイ手順

## 新しいMoveコードのデプロイ

### 前提条件

1. Sui CLIがインストールされていること
2. テストネットのアカウントが設定されていること
3. 十分なSUIガスがあること

### デプロイ手順

```bash
# 1. Moveコードをビルド
cd move/open_corner
sui move build

# 2. テストを実行（オプション）
sui move test

# 3. デプロイスクリプトを実行
cd ../..
bun run scripts/deploy-package.ts testnet
```

### 重要な変更点

**新しい設計（v2）:**
- TreasuryCapはMarketPoolに保存される
- 誰でも`split_usdo_for_market`を呼び出せる（TreasuryCap所有者である必要がない）
- `create_market`関数でTreasuryCapをMarketPoolに転送する必要がある

**旧設計（v1）との互換性:**
- 旧設計では、TreasuryCapを引数として渡す必要があった
- 新しいMarketを作成する際は、必ず新しい設計を使用すること

### 新しいMarketの作成

新しいMarketを作成する際は、`create_market`関数にTreasuryCapを渡す必要があります：

```typescript
import { createMarketTx } from "@/lib/sui/transactions";

// TreasuryCapを取得（YES_COINとNO_COINのTreasuryCapが必要）
const treasuryCapYesId = "0x..."; // TreasuryCap<YES_COIN> ID
const treasuryCapNoId = "0x...";  // TreasuryCap<NO_COIN> ID

// Marketを作成（TreasuryCapはMarketPoolに転送される）
const tx = new Transaction();
createMarketTx(
  adminCapId,
  eventId,
  question,
  vaultAddress,
  treasuryCapYesId,  // TreasuryCap<YES_COIN> (transferred to MarketPool)
  treasuryCapNoId,   // TreasuryCap<NO_COIN> (transferred to MarketPool)
  tx,
  packageId // Optional: override package ID
);

// トランザクションを実行
const result = await signAndExecuteTransactionBlock({
  transactionBlock: tx,
  options: {
    showEffects: true,
    showEvents: true,
    showObjectChanges: true,
  },
});

// Market IDとPool IDを取得
const marketChange = result.objectChanges?.find(
  (change: any) => change.type === "created" && change.objectType?.includes("Market")
);
const poolChange = result.objectChanges?.find(
  (change: any) => change.type === "created" && change.objectType?.includes("MarketPool")
);

const marketId = marketChange?.objectId;
const poolId = poolChange?.objectId;
```

### 既存Marketの移行

**重要**: 既存のMarket（旧設計で作成されたもの）は、新しい設計に移行できません。

理由：
- MarketPoolは既に作成されており、構造を変更できない
- TreasuryCapを後から追加する方法がない

**解決策:**
1. 新しいMarketを作成する（新しい設計を使用）
2. 既存のMarketはそのまま使用可能（旧設計のまま）
3. ただし、旧設計のMarketでは、TreasuryCap所有者がトランザクションを送信する必要がある

### デプロイ後の確認

1. パッケージIDを確認
   ```bash
   cat move/open_corner/PACKAGE_ID.txt
   ```

2. SEED_DATA.jsonを更新
   - `packageId`を新しいパッケージIDに更新
   - `treasuryCapYesId`と`treasuryCapNoId`は新しいMarket作成時に使用

3. フロントエンドの環境変数を更新
   - `.env.local`の`NEXT_PUBLIC_SUI_PACKAGE_ID`を更新

### トラブルシューティング

**エラー: "Incorrect number of arguments"**
- 原因: デプロイされているMoveコードが古いバージョン
- 解決策: 新しいMoveコードをデプロイする

**エラー: "Transaction was not signed by the correct sender"**
- 原因: TreasuryCapが別のアカウントによって所有されている
- 解決策: 新しい設計を使用してMarketを作成する（TreasuryCapをMarketPoolに転送）

**エラー: "Market object does not have pool_id field"**
- 原因: 旧設計で作成されたMarket（pool_idフィールドがない）
- 解決策: 新しいMarketを作成する


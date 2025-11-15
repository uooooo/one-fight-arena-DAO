# CPMM アーキテクチャ設計

## 設計の変更点

### 旧設計（v1）の問題点

1. **TreasuryCapの所有権問題**
   - TreasuryCapはパッケージ公開者によって所有される
   - 一般ユーザーが`split_usdo_for_market`を呼び出すには、TreasuryCap所有者がトランザクションを送信する必要がある
   - これにより、誰でも使える設計にならない

2. **エラー例**
   ```
   Transaction was not signed by the correct sender: 
   Object 0x... is owned by account address 0x..., 
   but given owner/signer address is 0x...
   ```

### 新設計（v2）の解決策

1. **TreasuryCapをMarketPoolに保存**
   - MarketPoolは`shared`オブジェクト
   - TreasuryCapをMarketPoolのフィールドとして保存
   - これにより、誰でもMarketPoolを通じてTreasuryCapにアクセス可能

2. **設計の利点**
   - ✅ 誰でも`split_usdo_for_market`を呼び出せる
   - ✅ TreasuryCap所有者である必要がない
   - ✅ より分散化された設計

## Moveコードの変更

### MarketPool構造体

```move
public struct MarketPool has key {
    id: UID,
    market_id: ID,
    yes_balance: Balance<YES_COIN>,
    no_balance: Balance<NO_COIN>,
    k: u128,
    collateral: Balance<USDO>,
    // 新しく追加
    treasury_cap_yes: TreasuryCap<YES_COIN>,
    treasury_cap_no: TreasuryCap<NO_COIN>,
}
```

### init_market_pool関数

```move
public fun init_market_pool(
    market_id: ID,
    treasury_cap_yes: TreasuryCap<YES_COIN>,  // 新しく追加
    treasury_cap_no: TreasuryCap<NO_COIN>,     // 新しく追加
    ctx: &mut TxContext,
): ID {
    let pool = MarketPool {
        // ...
        treasury_cap_yes,
        treasury_cap_no,
    };
    transfer::share_object(pool);
    object::id(&pool)
}
```

### split_usdo関数

```move
// 旧設計: TreasuryCapを引数として受け取る
public fun split_usdo(
    pool: &mut MarketPool,
    treasury_cap_yes: &mut TreasuryCap<YES_COIN>,  // 削除
    treasury_cap_no: &mut TreasuryCap<NO_COIN>,     // 削除
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
) { ... }

// 新設計: MarketPoolからTreasuryCapを取得
public fun split_usdo(
    pool: &mut MarketPool,
    usdo_coin: Coin<USDO>,
    ctx: &mut TxContext,
) {
    // TreasuryCaps are stored in the pool
    let yes_coin = coin::mint<YES_COIN>(&mut pool.treasury_cap_yes, usdo_amount, ctx);
    let no_coin = coin::mint<NO_COIN>(&mut pool.treasury_cap_no, usdo_amount, ctx);
    // ...
}
```

### create_market関数

```move
// 新設計: TreasuryCapを受け取り、MarketPoolに転送
public fun create_market(
    admin_cap: &ProtocolAdminCap,
    event_id: ID,
    question: vector<u8>,
    fee_bps: u64,
    vault_address: address,
    treasury_cap_yes: TreasuryCap<YES_COIN>,  // 新しく追加
    treasury_cap_no: TreasuryCap<NO_COIN>,     // 新しく追加
    ctx: &mut TxContext,
): ID {
    // TreasuryCaps are stored in the pool for public access
    let pool_id = market_pool::init_market_pool(
        market_id, 
        treasury_cap_yes,  // MarketPoolに転送
        treasury_cap_no,   // MarketPoolに転送
        ctx
    );
    // ...
}
```

## TypeScript側の変更

### splitUsdoForMarketTx関数

```typescript
// 旧設計: TreasuryCapを引数として受け取る
export function splitUsdoForMarketTx(
  marketId: string,
  poolId: string,
  treasuryCapYesId: string,  // 削除
  treasuryCapNoId: string,   // 削除
  usdoCoin: any,
  tx: Transaction,
) { ... }

// 新設計: TreasuryCap引数を削除
export function splitUsdoForMarketTx(
  marketId: string,
  poolId: string,
  usdoCoin: any,
  tx: Transaction,
  packageId?: string
) {
  tx.moveCall({
    target: `${packageId}::markets::split_usdo_for_market`,
    arguments: [
      tx.object(marketId),
      tx.object(poolId),  // MarketPool contains TreasuryCaps
      usdoCoin,
    ],
  });
}
```

### createMarketTx関数

```typescript
// 新設計: TreasuryCapを引数として受け取る
export function createMarketTx(
  adminCapId: string,
  eventId: string,
  question: string,
  vaultAddress: string,
  treasuryCapYesId: string,  // 新しく追加
  treasuryCapNoId: string,   // 新しく追加
  tx: Transaction,
  packageId?: string
) {
  tx.moveCall({
    target: `${packageId}::markets::create_market`,
    arguments: [
      tx.object(adminCapId),
      tx.pure.id(eventId),
      tx.pure.vector("u8", Array.from(Buffer.from(question, "utf-8"))),
      tx.pure.u64(500),
      tx.pure.address(vaultAddress),
      tx.object(treasuryCapYesId),  // MarketPoolに転送
      tx.object(treasuryCapNoId),   // MarketPoolに転送
    ],
  });
}
```

## CPMMの設計について

### 初期流動性

**SuiのCPMMでは初期流動性は不要です。**

理由：
- 最初の取引で流動性が自動的に作られる
- `split_usdo`を呼び出すと、YES/NOペアが作成され、プールに流動性が追加される
- その後、`swap_yes_for_no`や`swap_no_for_yes`で取引が可能

### k（constant product）の計算

**kは自動的に計算されます。**

```move
// 最初の取引時
k = yes_balance * no_balance

// 取引後もkは維持される（CPMMの特性）
(yes_balance + yes_in) * (no_balance - no_out) = k
```

### イーサリアムとの違い

1. **オブジェクト所有権モデル**
   - Suiでは、オブジェクトの所有権が重要
   - TreasuryCapのような重要なオブジェクトは、適切に管理する必要がある

2. **Shared Objects**
   - Suiでは、`shared`オブジェクトを使用して、誰でもアクセス可能にする
   - これにより、TreasuryCapをMarketPoolに保存して、誰でもアクセス可能にできる

3. **初期流動性**
   - イーサリアムのAMMでは、初期流動性の提供が必要
   - SuiのCPMMでは、最初の取引で流動性が自動的に作られる

## デプロイ手順

詳細は`docs/DEPLOYMENT.md`を参照してください。

## 既存Marketの移行

**重要**: 既存のMarket（旧設計で作成されたもの）は、新しい設計に移行できません。

理由：
- MarketPoolは既に作成されており、構造を変更できない
- TreasuryCapを後から追加する方法がない

**解決策:**
1. 新しいMarketを作成する（新しい設計を使用）
2. 既存のMarketはそのまま使用可能（旧設計のまま）
3. ただし、旧設計のMarketでは、TreasuryCap所有者がトランザクションを送信する必要がある


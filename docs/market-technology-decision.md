# 予測市場の技術選定：DeepBook vs CPMM vs 固定オッズ

> **注意**: 実装はAI Agentが行うため、複雑さは問題にならない。Suiならではの技術をアピールするため、DeepBookをMVPに含めることを推奨。

## 調査結果サマリー

### DeepBookについて

**概要**:
- DeepBookV3はSui公式のCLOB（中央リミットオーダーブック）
- TypeScript SDKが提供されている（`@mysten/deepbook-v3`）
- SDKは取引の複雑さを抽象化してくれる
- 公式ドキュメントが充実している
- Suiの並列実行を活用した高性能な取引が可能

**予測市場への適用可能性**:
- DeepBookは通常のトークン交換用（例：SUI/USDCペア）だが、カスタムコインを作成できる
- 予測市場では、YES/NOを2つのカスタムコインとして作成し、DeepBookでオーダーブックを形成
- DeepBookのSDKを使えば、オーダーブックの機能を活用できる
- Suiならではの技術をアピールできる

**実装の難易度**:
- SDKが提供されているため、統合自体は比較的容易
- カスタムコインの作成と決済ロジックの実装が必要
- 初期流動性の提供が必要（ただし、これはデモ用なので少量でOK）

**決済ロジックの設計**:
1. **市場作成時**:
   - Moveで`YES_COIN`と`NO_COIN`の2つのカスタムコインを作成
   - DeepBookで`YES_COIN/NO_COIN`ペアのオーダーブックを作成
   - 初期流動性を提供（例：各1000コイン）

2. **取引時**:
   - ユーザーはSUIでYESコインまたはNOコインを購入
   - DeepBookのオーダーブックでマッチングが行われる
   - 価格は需要と供給で動的に決定される

3. **決済時**:
   - イベント結果が確定したら、`Market`オブジェクトに結果を記録
   - 勝った側のコイン（例：YES）を1:1でSUIに交換できるようにする
     - `redeem_winning_coin`関数で、YESコイン1枚 = SUI 1枚に交換
   - 負けた側のコイン（例：NO）は無効化（または0価値に）
   - 手数料（例：5%）を徴収してSupportVaultに送金

**決済ロジックの実装例（Move）**:
```move
// 決済関数の疑似コード
public fun resolve_market(
    market: &mut Market,
    admin_cap: &AdminCap,
    result: bool, // true = YES wins, false = NO wins
    yes_coin_type: Type,
    no_coin_type: Type,
) {
    // 市場をクローズ
    market.state = RESOLVED;
    market.result = result;
    
    // 勝った側のコインをSUIに交換可能にする
    if (result) {
        // YESが勝った場合、YESコインをSUIに交換可能にする
        market.winning_coin_type = yes_coin_type;
    } else {
        // NOが勝った場合、NOコインをSUIに交換可能にする
        market.winning_coin_type = no_coin_type;
    }
}

// 勝ったコインをSUIに交換
public fun redeem_winning_coin(
    market: &Market,
    winning_coins: Coin<WinningCoinType>,
): Coin<SUI> {
    assert!(market.state == RESOLVED, E_MARKET_NOT_RESOLVED);
    assert!(market.winning_coin_type == type_of(winning_coins), E_WRONG_COIN);
    
    // 手数料を徴収（5%）
    let fee = coin::value(&winning_coins) * 5 / 100;
    let fee_coin = coin::extract(&mut winning_coins, fee);
    
    // 残りをSUIに交換（1:1）
    let sui_amount = coin::value(&winning_coins);
    let sui_coin = coin::from_balance(coin::into_balance(winning_coins), SUI);
    
    // 手数料をSupportVaultに送金
    transfer::public_transfer(fee_coin, market.vault_address);
    
    sui_coin
}
```

---

### CPMM（Constant Product Market Maker）について

**概要**:
- Uniswapなどで採用されているAMMモデル
- x * y = k の数式に基づく価格決定
- 流動性プールを必要とする

**予測市場への適用可能性**:
- CPMMはトークン交換用に設計されている
- 予測市場に適用するには、YES/NOを2つのコインとして扱う必要がある
- 流動性プールの管理、価格計算、スリッページ処理などが必要

**実装の難易度**:
- Sui初心者には非常に難しい
- 流動性プールの管理、価格計算、スリッページ処理など多くの要素が必要
- ハッカソンで3日間で完成させるのは現実的ではない

---

### 固定オッズ市場について

**概要**:
- YES/NOの2択で、固定オッズ（例：YES 1.5倍、NO 2.0倍）を設定
- 流動性プールは不要
- 単純に「YES側に賭けた金額」と「NO側に賭けた金額」を記録
- 決済時は、勝った側の総額を負けた側から徴収して配分

**予測市場への適用可能性**:
- 予測市場に最適
- シンプルで理解しやすい
- 実装が容易

**実装の難易度**:
- 非常にシンプル
- Sui初心者でも実装可能
- ハッカソンで3日間で完成可能

---

## 技術選定の結論

### MVP（推奨）：DeepBook統合

**理由**:
1. **Suiならではの技術**: Suiエコシステムの公式プロトコルで、ハッカソンで評価されやすい
2. **高性能**: Suiの並列実行を活用したオーダーブック
3. **SDKが提供されている**: `@mysten/deepbook-v3`で統合が容易
4. **実装はAI Agentが行う**: 複雑さは問題にならない
5. **デモ価値が高い**: オーダーブック風のUIで視覚的に魅力的

**実装内容**:
- Moveで`YES_COIN`と`NO_COIN`の2つのカスタムコインを作成
- DeepBookで`YES_COIN/NO_COIN`ペアのオーダーブックを作成
- 初期流動性を提供（デモ用なので少量でOK）
- 決済ロジックを実装（勝った側のコインを1:1でSUIに交換）
- 手数料（5%）をSupportVaultに送金

**フロントエンド**:
- DeepBookのSDKを使って、オーダーブック風のUIを実装
- リアルタイムで価格と流動性を表示
- 注文の配置とマッチング状況を可視化

---

### フォールバック：固定オッズ市場（時間がない場合）

**理由**:
- 実装が最もシンプルで、時間がない場合の緊急フォールバックとして有効
- フロントエンドで計算する方式も可能（Move側は最小限）

**実装内容（フロントエンド計算版）**:
- Move側：`Market`オブジェクトに`total_yes`と`total_no`を記録するだけ
- フロントエンド：オッズ計算をクライアント側で行う
  - `odds_yes = total_no / total_yes`
  - `odds_no = total_yes / total_no`
- 決済時：勝った側の総額を負けた側から徴収して配分（Move側で実装）

**使用ケース**:
- DeepBook統合に時間がかかりすぎる場合
- 初期プロトタイプとして動作確認したい場合

---

## 推奨アプローチ

### Phase 1（MVP）: DeepBook統合
- DeepBookのSDKを使って、オーダーブック風の予測市場を実装
- YES/NOを2つのカスタムコインとして作成
- 決済ロジックを実装（勝った側のコインを1:1でSUIに交換）
- Suiならではの技術をアピール

### Phase 2（フォールバック）: 固定オッズ市場
- DeepBook統合に時間がかかる場合の緊急フォールバック
- フロントエンドで計算する方式も可能（Move側は最小限）
- シンプルで確実に動作する予測市場を実装

## DeepBookを使った決済ロジックの詳細設計

### 1. 市場作成時のフロー

```move
// 1. カスタムコインを作成
public fun create_market_coins(
    admin_cap: &AdminCap,
    market_id: ID,
): (TreasuryCap<YES_COIN>, TreasuryCap<NO_COIN>) {
    // YESコインとNOコインを作成
    let yes_treasury = coin::create_currency<YES_COIN>(admin_cap, 9, b"YES", b"", option::none());
    let no_treasury = coin::create_currency<NO_COIN>(admin_cap, 9, b"NO", b"", option::none());
    
    (yes_treasury, no_treasury)
}

// 2. DeepBookでオーダーブックを作成
// TypeScript側でDeepBook SDKを使用
```

### 2. 取引時のフロー

```typescript
// TypeScript側（DeepBook SDK使用）
import { DeepBookClient } from '@mysten/deepbook-v3';

// YESコインを購入
async function buyYesCoin(amount: number) {
  const tx = new Transaction();
  // DeepBookのplaceLimitOrderを使用
  dbClient.placeLimitOrder(
    'YES_COIN',
    'NO_COIN',
    'buy',
    amount,
    price,
    'MANAGER_1'
  )(tx);
  await suiClient.signAndExecuteTransaction({ transaction: tx, signer: keypair });
}
```

### 3. 決済時のフロー

```move
// Move側：決済ロジック
public fun resolve_market(
    market: &mut Market,
    admin_cap: &AdminCap,
    result: bool, // true = YES wins, false = NO wins
    yes_treasury: &mut TreasuryCap<YES_COIN>,
    no_treasury: &mut TreasuryCap<NO_COIN>,
) {
    assert!(market.state == OPEN, E_MARKET_NOT_OPEN);
    
    // 市場をクローズ
    market.state = RESOLVED;
    market.result = result;
    
    // 勝った側のコインタイプを記録
    if (result) {
        market.winning_coin_type = type_<YES_COIN>();
    } else {
        market.winning_coin_type = type_<NO_COIN>();
    }
    
    // 負けた側のコインを無効化（オプション）
    // または、0価値として扱う
}

// 勝ったコインをSUIに交換
public fun redeem_winning_coin(
    market: &Market,
    winning_coins: Coin<WinningCoinType>,
    yes_treasury: &mut TreasuryCap<YES_COIN>,
    no_treasury: &mut TreasuryCap<NO_COIN>,
): Coin<SUI> {
    assert!(market.state == RESOLVED, E_MARKET_NOT_RESOLVED);
    
    let coin_value = coin::value(&winning_coins);
    
    // 手数料を徴収（5%）
    let fee = coin_value * 5 / 100;
    let fee_coin = coin::extract(&mut winning_coins, fee);
    
    // 残りをSUIに交換（1:1）
    let sui_amount = coin::value(&winning_coins);
    
    // コインを破棄してSUIを生成（簡略化版）
    // 実際には、プールからSUIを引き出す必要がある
    coin::burn(winning_coins);
    
    // 手数料をSupportVaultに送金
    transfer::public_transfer(fee_coin, market.vault_address);
    
    // SUIを返す（実際の実装では、プールから引き出す）
    // ここでは簡略化
    coin::zero<SUI>()
}
```

### 4. 実装上の注意点

1. **初期流動性の提供**:
   - デモ用なので、各コイン1000枚程度でOK
   - 初期価格は1:1（YES 1枚 = NO 1枚 = SUI 0.5枚程度）

2. **決済時のコイン交換**:
   - 勝った側のコインを1:1でSUIに交換
   - 実際の実装では、プールからSUIを引き出す必要がある
   - または、コインを破棄して、対応するSUIを返す

3. **負けた側のコイン**:
   - 無効化するか、0価値として扱う
   - ユーザーには「負けたコインは無効」と表示

4. **手数料の徴収**:
   - 決済時に5%の手数料を徴収
   - SupportVaultに送金

---

## 実装の優先順位

### 最優先（MVP）: DeepBook統合
- Suiならではの技術をアピールできる
- ハッカソンで評価されやすい
- 実装はAI Agentが行うため、複雑さは問題にならない

### フォールバック: 固定オッズ市場
- DeepBook統合に時間がかかる場合の緊急フォールバック
- フロントエンドで計算する方式も可能
- 最小限のMove実装で動作確認可能

## 参考資料

- [DeepBookV3公式ドキュメント](https://docs.sui.io/standards/deepbook)
- [DeepBookV3 SDK](https://github.com/MystenLabs/ts-sdks/tree/main/packages/deepbook-v3)
- [DeepBookV3 NPMパッケージ](https://www.npmjs.com/package/@mysten/deepbook-v3)
- [DeepBookV3 SDK ドキュメント](https://docs.sui.io/standards/deepbookv3-sdk)


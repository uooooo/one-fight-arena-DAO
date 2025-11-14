# ドキュメントレビュー結果と改善提案

## 総合評価

全体的に**コンセプトは明確で、Suiの特徴を活かした設計**になっています。ただし、**Sui初心者にとっての実現可能性**と**ハッカソンの時間制約**を考慮すると、いくつかの調整が必要です。

---

## 1. 重大な懸念事項

### 1.1 CPMM（Constant Product Market Maker）の実装複雑度

**問題点**:
- `requirements.md`では「binary CPMM markets」をMVPに含めているが、CPMMの実装は**Sui初心者には非常に難しい**
- Move言語でのAMM実装は、エラーハンドリング、スリッページ計算、流動性管理など多くの要素が必要
- ハッカソンで3日間で完成させるのは現実的ではない

**推奨改善**:
- **Option A（推奨）**: CPMMを**簡易な固定オッズ市場**に変更
  - YES/NOの2択で、固定オッズ（例：YES 1.5倍、NO 2.0倍）を設定
  - 流動性プールは不要。単純に「YES側に賭けた金額」と「NO側に賭けた金額」を記録
  - 決済時は、勝った側の総額を負けた側から徴収して配分
- **Option B**: CPMMを**完全にモック**にして、フロントエンドで価格計算をシミュレート
  - Move側は単純な「YES/NOポジション記録」のみ
  - フロントエンドでCPMMの価格曲線を計算して表示

**影響範囲**:
- `requirements.md` Section 7, 10, F4 の修正が必要
- `plan.md` Phase 1の見積もりを短縮可能

---

### 1.2 zkLoginの優先順位の矛盾

**問題点**:
- `hackathon-idea.md`では「Suiの強み」としてzkLoginを強調
- `requirements.md`では「Phase 2 (stretch)」として後回し
- `plan.md`ではPhase 4のStretch Experimentsに含まれている

**推奨改善**:
- **ハッカソンのデモ価値を最大化するため、zkLoginをMVPに含める**
- Suiの「Web2ライクなUX」をアピールするには、zkLoginは必須
- 実装は比較的シンプル（Mysten SDKのサンプルコードを流用可能）

**具体的な変更**:
- `requirements.md` Section 7: zkLoginをMVPに移動
- `plan.md` Phase 2: zkLogin統合を必須タスクに追加
- ただし、**wallet-kitも並行してサポート**（フォールバック用）

---

### 1.3 オブジェクト設計の複雑さ

**問題点**:
- `requirements.md` Section 10のオブジェクト設計が**MVPとしては過剰**
- 例：`SupportVault`に`revenue_sources`, `treasury_cut_bps`, `tier_config`など多数のフィールド
- `Market`に`pool_yes`, `pool_no`, `fee_vault`など、CPMM前提の設計

**推奨改善**:
- MVPでは**最小限のフィールドのみ**に絞る
- 例：
  ```move
  // MVP版（簡略化）
  struct SupportVault has key {
      id: UID,
      fighter: ID,
      balance: Balance<SUI>,
  }
  
  struct Market has key {
      id: UID,
      event: ID,
      question: String,
      state: u8, // 0=open, 1=resolved_yes, 2=resolved_no
      total_yes: u64,
      total_no: u64,
  }
  ```

---

## 2. 中程度の懸念事項

### 2.1 時間見積もりの不足

**問題点**:
- `plan.md`のフェーズ分けは良いが、**各タスクの時間見積もりがない**
- 「Day 1」「Day 2」という表現だが、実際の作業時間が不明

**推奨改善**:
- 各フェーズに**時間見積もり（時間単位）**を追加
- 例：
  ```
  Phase 1 – Move Foundations (8-12時間)
  - Scaffold Move workspace (1時間)
  - Implement fighters module (2-3時間)
  - Implement support module (2-3時間)
  - Implement markets module (3-4時間)
  - Unit tests (1-2時間)
  ```

---

### 2.2 GraphQL RPCの必要性

**問題点**:
- `requirements.md`でGraphQL RPCを多用しているが、**MVPでは不要**
- JSON-RPCで十分。GraphQLは複雑なクエリが必要な場合のみ

**推奨改善**:
- MVPではJSON-RPCのみを使用
- GraphQLは「Stretch」に移動

---

### 2.3 Sponsored Transactionsの実装タイミング

**問題点**:
- `requirements.md`では「Sponsored Tx for deposits/trades」とあるが、実装方法が不明確
- Sui初心者には、Sponsored Txのセットアップ（スポンサーウォレットの準備など）が障壁になる可能性

**推奨改善**:
- MVPでは**通常のトランザクション**で開始
- Sponsored Txは「デモ用の特別なケース」として、後から追加
- または、**TestnetのFaucetで十分なSUIを取得**して、ガス代を気にしない設計

---

## 3. 軽微な改善提案

### 3.1 ディレクトリ構造の一貫性

**問題点**:
- `requirements.md` Section 12と`AGENTS.md` Section 3で、ディレクトリ構造が微妙に異なる
- `app/`配下の構造が明確でない

**推奨改善**:
- `AGENTS.md`の構造を`requirements.md`に合わせる
- または、`requirements.md`を`AGENTS.md`に合わせる

---

### 3.2 テスト戦略の具体化

**問題点**:
- `requirements.md`で「Vitest + React Testing Library」とあるが、**どのレベルまでテストするか**が不明確
- Move unit testsも「必須」とあるが、カバレッジ目標がない

**推奨改善**:
- MVPでは**クリティカルパスのみテスト**
- Move: 主要な関数（create_vault, deposit, trade, resolve）のみ
- Frontend: 主要なユーザーフロー（ログイン、取引、決済）のみ

---

### 3.3 エラーハンドリングの具体化

**問題点**:
- `requirements.md` Section 9で「Graceful fallback」とあるが、**具体的なエラーケース**が不明確

**推奨改善**:
- 主要なエラーケースをリスト化：
  - RPC接続エラー → リトライ3回、その後モックデータ表示
  - トランザクション失敗 → エラーメッセージ表示、再試行ボタン
  - ウォレット未接続 → 接続プロンプト表示

---

## 4. ドキュメント間の一貫性チェック

### 4.1 矛盾点の整理

| 項目 | hackathon-idea.md | requirements.md | plan.md | 推奨 |
|------|-------------------|-----------------|---------|------|
| zkLogin | 強調（Suiの強み） | Phase 2 stretch | Phase 4 stretch | **MVPに含める** |
| CPMM | 言及なし | MVP必須 | Phase 1 | **簡略化またはモック** |
| PPVPass | オブジェクト設計に含む | 非目標 | なし | **Future Extensionsに移動** |
| DeepBook | 将来拡張 | Stretch | Phase 4 | ✅ 一貫 |

---

## 5. Sui初心者への配慮

### 5.1 学習リソースの追加

**推奨**:
- `AGENTS.md`に**Sui初心者向けの学習パス**を追加：
  ```
  ## 8. Sui初心者向け学習リソース
  - [ ] Sui公式ドキュメント「Getting Started」を読む（1-2時間）
  - [ ] Move言語の基本構文を理解する（2-3時間）
  - [ ] Sui TypeScript SDKのサンプルコードを動かす（1-2時間）
  - [ ] ローカルネットワークで簡単なMoveモジュールをデプロイ（1-2時間）
  ```

---

### 5.2 実装の段階的アプローチ

**推奨**:
- `plan.md`に**「最小動作版」→「機能追加」→「統合」**の3段階を明記
- 各段階で**動作確認可能な状態**を保つ

---

## 6. 優先順位の再整理（推奨）

### MVP（必須実装）
1. ✅ ウォレット接続（wallet-kit）
2. ✅ zkLogin（Google OAuth）
3. ✅ FighterProfile作成・表示
4. ✅ SupportVault作成・入金
5. ✅ SupporterNFTミント
6. ✅ 簡易予測市場（固定オッズ、YES/NO）
7. ✅ 市場決済（手動）
8. ✅ 基本的なUI（Markets/Supportタブ）

### Stretch（時間があれば）
- CPMM実装
- GraphQL RPC統合
- Sponsored Transactions
- 高度なAnalytics
- DeepBook統合

---

## 7. 具体的な修正提案

### requirements.md の修正箇所

1. **Section 7 (MVP Scope)**:
   - CPMM → 固定オッズ市場に変更
   - zkLoginをMVPに移動

2. **Section 10 (On-Chain Design)**:
   - オブジェクト設計を簡略化
   - CPMM関連のフィールドを削除

3. **Section F4 (Prediction Markets)**:
   - CPMM → 固定オッズに変更
   - 価格計算ロジックを簡略化

### plan.md の修正箇所

1. **Phase 1**:
   - CPMM実装を削除
   - 固定オッズ市場の実装に変更
   - 時間見積もりを追加

2. **Phase 2**:
   - zkLogin統合を必須タスクに追加
   - 時間見積もりを追加

### AGENTS.md の修正箇所

1. **Section 8を追加**:
   - Sui初心者向け学習リソース
   - 段階的実装アプローチ

---

## 8. 最終推奨事項

### 即座に修正すべき項目（Critical）
1. ✅ CPMMを固定オッズ市場に変更
2. ✅ zkLoginをMVPに含める
3. ✅ オブジェクト設計を簡略化

### できるだけ修正すべき項目（High Priority）
4. ✅ 時間見積もりを追加
5. ✅ エラーハンドリングを具体化
6. ✅ テスト戦略を明確化

### あれば良い項目（Nice to Have）
7. ⚠️ GraphQL RPCをStretchに移動
8. ⚠️ 学習リソースセクションを追加

---

## まとめ

**良い点**:
- コンセプトが明確で、Suiの特徴を活かしている
- MVPスコープが適切に定義されている
- ドキュメント構造が整理されている

**改善が必要な点**:
- CPMMの実装が複雑すぎる（固定オッズに変更推奨）
- zkLoginの優先順位が低い（MVPに含める推奨）
- 時間見積もりが不足している

**総合評価**: ⭐⭐⭐⭐ (4/5)
- コンセプトと設計は優秀だが、実装の複雑度を下げる必要がある


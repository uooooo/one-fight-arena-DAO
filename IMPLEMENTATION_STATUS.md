# 実装進捗状況

## Phase 0 - 環境構築 ✅ 完了

- [x] BunワークスペースとNext.js App Routerプロジェクト初期化
- [x] Tailwind CSS + shadcn/ui設定（ONE Championshipブランディング適用）
- [x] ESLint + Prettier設定
- [x] Vitest + React Testing Library設定
- [x] .editorconfig作成
- [x] GitHub Actions CI workflow作成
- [x] 必要なパッケージインストール（@mysten/sui, @mysten/wallet-kit, @mysten/deepbook等）

## Phase 1 - Move Foundations ✅ 完了

- [x] Moveワークスペース作成 (`move/open_corner/`)
- [x] 基本モジュール実装:
  - [x] `fighters.move` - FighterProfile管理
  - [x] `support.move` - SupportVaultとSupporterNFT
  - [x] `yes_coin.move` - YESコイン作成（One-Time Witnessパターン）
  - [x] `no_coin.move` - NOコイン作成（One-Time Witnessパターン）
  - [x] `markets.move` - 予測市場の作成・決済・償還
  - [x] `tests.move` - ユニットテスト
- [x] Moveビルドエラー修正（Suiフレームワーク依存関係の調整完了）
- [x] `ProtocolAdminCap`の初期化関数追加（`init`関数）
- [x] デプロイスクリプト作成（`scripts/deploy-package.ts`）
- [x] シードスクリプト作成（`scripts/seed-data.ts`）
- [ ] ローカルネットワークでのテスト
- [ ] TestnetへのデプロイとパッケージIDの記録

## Phase 2 - Frontend MVP 🚧 進行中

- [x] レイアウト、ナビゲーション、ヒーローセクション実装
- [x] イベント一覧ページとイベント詳細ページ作成
- [x] Marketsタブ実装（オーダーブックUI、注文配置フォーム）
- [x] Supportタブ実装（ボルト表示、プログレスバー）
- [x] Suiウォレット接続統合（@mysten/wallet-kit + ConnectButton）
- [x] DeepBook SDK統合（トランザクションビルダー実装）
- [x] Suiクライアント設定とヘルパー関数
- [x] ONE Championshipブランドカラー適用（グレー、黄色）
- [x] Atlassian Design System原則に基づくUI実装
- [x] パッケージIDを環境変数から読み取る設定（`constants.ts`更新）
- [x] Suiクライアントのローカルネットワーク対応（`client.ts`更新）
- [x] ローカルネットワークへのデプロイ完了（パッケージID: `0x7f8925011b3810f6c593e19aad48c5c9e5789de0395584bca356a79e2496868b`）
- [x] シードデータの作成完了（Fighter, Vault, Market）
- [x] フロントエンドの動作確認完了（playwright-mcp使用）
- [ ] 実際のMoveパッケージとのトランザクション実行テスト

## 次のステップ

1. ✅ デプロイスクリプトとシードスクリプトの作成完了
2. Moveパッケージをローカルネットワークにデプロイ（`bun run scripts/deploy-package.ts local`）
3. TestnetへのデプロイとパッケージIDの記録（`bun run scripts/deploy-package.ts testnet`）
4. シードデータの作成（`bun run scripts/seed-data.ts <network> <package-id> <admin-cap-id>`）
5. フロントエンドとMoveパッケージの統合（`.env.local`にパッケージIDを設定）
6. 実際のトランザクション実行のテスト

## 注意事項

- Moveモジュールはビルド成功済み
- フロントエンドはモックデータで動作確認可能
- ウォレット接続は動作確認済み（ConnectButton使用）
- DeepBook統合のトランザクション実行は、Moveパッケージデプロイ後に接続予定
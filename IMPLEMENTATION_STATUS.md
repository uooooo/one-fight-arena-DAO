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
- [x] ローカルネットワークでのテスト
- [x] TestnetへのデプロイとパッケージIDの記録（パッケージID: `0xef78795a038b2743a2c20a0a2ab8c46f4c0b11dc277f9cf6e2587186b12798e6`）

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
- [x] 実際のMoveパッケージとのトランザクション実行テスト（ローカル・Testnet両方）
- [x] Testnetでのシードデータ作成完了

## 次のステップ

1. ✅ デプロイスクリプトとシードスクリプトの作成完了
2. ✅ Moveパッケージをローカルネットワークにデプロイ完了
3. ✅ TestnetへのデプロイとパッケージIDの記録完了（パッケージID: `0xef78795a038b2743a2c20a0a2ab8c46f4c0b11dc277f9cf6e2587186b12798e6`）
4. ✅ Testnetでのシードデータ作成完了
5. ✅ フロントエンドとMoveパッケージの統合完了
6. ✅ 実際のトランザクション実行のテスト完了（ローカル・Testnet両方）
7. 🔄 Testnetでのフロントエンド動作確認（`.env.local`にTestnetパッケージIDを設定）
8. 🔄 Testnetでの統合テスト実行

## 注意事項

- Moveモジュールはビルド成功済み
- フロントエンドはモックデータで動作確認可能
- ウォレット接続は動作確認済み（ConnectButton使用）
- DeepBook統合のトランザクション実行は、Moveパッケージデプロイ後に接続予定
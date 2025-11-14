# 実装進捗状況

## Phase 0 - 環境構築 ✅ 完了

- [x] Tailwind CSS + shadcn/ui設定
- [x] ESLint + Prettier設定
- [x] Vitest + React Testing Library設定
- [x] .editorconfig作成
- [x] GitHub Actions CI workflow作成
- [x] 必要なパッケージインストール（@mysten/sui, @mysten/wallet-kit, @mysten/deepbook-v3等）

## Phase 1 - Move Foundations 🚧 進行中

- [x] Moveワークスペース作成 (`move/open_corner/`)
- [x] 基本モジュール実装:
  - [x] `fighters.move` - FighterProfile管理
  - [x] `support.move` - SupportVaultとSupporterNFT
  - [x] `yes_coin.move` - YESコイン作成
  - [x] `no_coin.move` - NOコイン作成
  - [x] `markets.move` - 予測市場の作成・決済・償還
  - [x] `tests.move` - ユニットテスト
- [ ] Moveビルドエラー修正（Suiフレームワーク依存関係の調整が必要）
- [ ] ローカルネットワークでのテスト
- [ ] Testnetへのデプロイ

## 次のステップ

1. Moveモジュールのビルドエラーを修正（Suiフレームワークの依存関係設定を調整）
2. Phase 2のフロントエンド実装を開始
3. DeepBook SDK統合の準備

## 注意事項

- Moveモジュールのビルドには、Suiフレームワークの正しい依存関係設定が必要
- DeepBook統合は、Moveモジュールが動作してから実装する予定
- フロントエンドはモックデータで先に進めることができる

https://atlassian.design/components
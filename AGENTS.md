# Agent Playbook — Open Corner on Sui

このリポジトリは「Open Corner on Sui」ハッカソンMVPを素早く組み立てるための共同作業場です。以下のガードレールと役割定義に従って開発を進めてください。

## 1. ミッションと背景
- ONE Championshipのファン主導プロモーションを Sui 上で証明する。
- Fight Week prediction market + SupportVault + SupporterNFT を 1大会・1選手スコープで動かす。
- 企画／要件は必ず `docs/requirements.md` を単一の真実として参照する。

## 2. コア技術スタック
- **Web**: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui。パッケージマネージャは **Bun** を第一優先に利用する。
- **Sui**: Mysten TypeScript SDK, wallet-kit, zkLogin（または互換ウォレット）。Move パッケージは `move/open_corner/` 配下に配置。
- **データ**: Sui RPC/GraphQL。必要なら軽量な JSON データソースまたは Supabase 等を `lib/` に実装。
- **ツール**: ESLint + Biome (optional) + Prettier, Vitest, React Testing Library, Move unit tests, GitHub Actions (CI)。

## 3. ディレクトリ・役割
```
app/                 Next.js routes (App Router)
components/          Reusable UI primitives + feature widgets
features/            Feature-specific hooks/state/business logic
lib/                 Sui client, auth, analytics, utilities
move/open_corner/    Move modules (fighters, support, markets)
scripts/             Tooling (docs crawler, seeding, settlement)
docs/                Requirements + scraped references
```
- 新しいコードは原則 `features/<feature-name>/` に閉じ込め、`app/` にはプレゼンテーションロジックのみを置く。
- Sui Tx ビルダーは `lib/sui/transactions.ts` に集約し、UI からは直接 `TransactionBlock` を扱わない。

## 4. 主要ワークストリーム
### Product / UX
- 要件差分は `docs/requirements.md` に Pull Request を通して追記。Notion 等の散逸を禁止。
- 画面フロー図は `/docs/ui`（新規作成可）に Figma エクスポートや Mermaid で残す。

### Frontend
- Bun `create-next-app` -> App Router を厳守。`bun run lint`, `bun run test` を CI gate に設定。
- Tailwind + shadcn/ui で UI を構築。新規UIは `components/ui/` にラップし、`components/market/`, `components/vault/` などのドメイン別に整理。
- データ取得は RSC + server actions + React Query/SWR。Sui RPC は `lib/sui/client.ts` 経由のみ。

### Move / Chain
- Move packages: `fighters.move`, `support.move`, `markets.move`。モジュール構造と公開関数は requirements に記載の API を守る。
- ローカルテスト: `sui move test` 必須。`move/open_corner/README.md` にビルド手順と公開IDを記録。
- 本番用デプロイ（Testnet）後はパッケージIDを `.env` と `docs/requirements.md` に更新。

### Tooling / DevRel
- `scripts/` に seed や resolver 用の Bun スクリプトを追加。TypeScript で書き、`bun run` で動かす。
- ドキュメント収集ツール（例: `crawl_sdk_typescript_docs.py`）はメンテし、README か `docs/requirements.md` にリンク。

## 5. 実装ポリシー
- Git: 小まめに commit & push。コミットメッセージは `feat|fix|chore: description` を推奨。
- テスト: UI 変更は最低1つのスナップしない機能テストを添付。Move 変更は対になるユニットテストを追加。
- Secrets: `.env.local` を利用し、Never commit secrets。共有値は `.env.example` に記載。
- アクセシビリティと多言語: カスタム copy は `lib/i18n/strings.ts`（予定）に集中管理。英語/日本語キーを揃える。

## 6. 参考ドキュメント
- `docs/sui-official/` — 公式 Sui ドキュメントの MDX コピー。
- `docs/scraped/` — WebスクレイピングしたMarkdown（Sui docs, Mysten TypeScript SDK）。
- 外部リンクを参照する際は、上記ローカルコピーを優先し、URL も記述。context7 ミラーがある場合は最新差分を確認してから参照。

## 7. 連絡・レビュー
- 大きな設計変更は Issue か Discussion で合意をとる。
- PR 説明には「意図」「テスト結果」「影響範囲」を必ず書く。
- 緊急バグは `fix:` コミットで直接 main へ push しても良いが、その場合は直後に TODO Issue を作成。

このガイドラインを出発点として、実装フェーズでは常に `docs/requirements.md` との整合性をチェックしながら進めてください。

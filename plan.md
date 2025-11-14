# ONE Fight Arena DAO — Execution Plan

Reference: `docs/requirements.md`

## Phase 0 – Repo & Environment ✅ 完了
**Goal**: Have a clean Bun + Next.js workspace with lint/test scaffolding and shared UI tooling.
- [x] Initialize Bun workspace (`bun init`) and Next.js App Router project under `/app`.
- [x] Configure Tailwind + shadcn/ui, base typography, and theme tokens (ONE Championship branding).
- [x] Set up linting (ESLint), formatting (Prettier), and testing (Vitest + RTL) with `bun run lint|test` scripts.
- [x] Create `.env.example`, `.editorconfig`, and minimal GitHub Actions workflow for lint/test.

## Phase 1 – Move Foundations (DeepBook Integration) ✅ 完了
**Goal**: Ship the smallest viable Move surface (single event, binary prediction markets using DeepBookV3, SupportVault + Supporter NFT mint) on localnet, then iterate.
**Estimated Time**: 10-14 hours
- [x] Scaffold Move workspace under `move/open_corner` with package manifest. (1 hour)
- [x] Implement MVP-only modules (`fighters`, `support`, `markets`, `yes_coin`, `no_coin`) covering: create fighter, open vault, deposit, mint supporter tier, create custom coins (YES/NO), create DeepBook pool, resolve market, redeem winning coins. (6-9 hours)
  - [x] `fighters.move`: FighterProfile creation
  - [x] `support.move`: SupportVault creation, deposit, SupporterNFT mint
  - [x] `yes_coin.move` and `no_coin.move`: Custom coin creation per market
  - [x] `markets.move`: Market creation, DeepBook pool setup, resolution, redemption (1:1 SUI exchange)
- [x] Add Move unit tests for critical paths (create_vault, deposit, create_coins, resolve, redeem); defer perk automation/complex vault logic to stretch issues. (2-3 hours)
- [ ] Author CLI/Bun scripts to publish package to localnet and seed the single demo event with initial liquidity. (1 hour)
- [ ] Dry run Testnet publish; document package ID + capabilities in `docs/requirements.md` and `.env`. (30 min)

## Phase 2 – Frontend MVP (Rich UI with DeepBook Integration) 🚧 進行中
**Goal**: Deliver the full Fight Week Markets/Support experience with production-quality UI, DeepBook SDK integration, initially backed by mocks/localnet, wallet connect only.
**Estimated Time**: 12-16 hours
- [x] Implement layout, navigation, hero, and persistent tab bar shared across routes. (2-3 hours)
- [x] Integrate DeepBook SDK (`@mysten/deepbook-v3`): install package, set up DeepBookClient, create balance manager. (2-3 hours)
- [x] Build `Markets` tab (Promotion Layer): market list, storyline groupings, order book UI (bid/ask display), place order modal, positions drawer (can read from mock/localnet data while Move stabilizes). (5-6 hours)
- [x] Build `Support` tab (Sponsorship Layer): fighter carousel, SupportVault meter, Supporter NFT mint/deposit components (UI finished even if transactions mocked). (3-4 hours)
- [x] Integrate Sui wallet-kit connect; abstract auth layer to swap in zkLogin later without UI changes. (1-2 hours)
- [x] Implement transaction builders for DeepBook orders and redemption; can operate against mocked/localnet RPC endpoints. (2-3 hours)
- [ ] Connect transaction execution to actual Move package (pending package deployment)

## Phase 3 – Integration & Demo Polish
**Goal**: Connect UI to live Sui package, finalize analytics, and script the demo.
**Estimated Time**: 6-8 hours
- [ ] Swap mocked data for real Sui JSON-RPC queries; verify end-to-end bet/deposit/settlement. (2-3 hours)
- [ ] Implement analytics hooks + dashboard snapshot for vault totals. (1-2 hours)
- [ ] Prepare scripted demo scenario (storyboard, slides, recorded backup video). (2-3 hours)
- [ ] Final QA pass: accessibility, responsive layouts, error-handling. (1 hour)

## Phase 4 – Stretch Experiments (post-MVP if time remains)
**Goal**: Layer in additional features once DeepBook markets + SupportVault flows are stable.
- [ ] Add advanced SupportVault logic (withdrawal scheduling, perk automation).
- [ ] Evaluate zkLogin integration top-to-bottom and Sponsored Tx UX polish.
- [ ] Fallback: if DeepBook integration takes too long, implement simple fixed-odds markets (frontend-calculated odds) as emergency fallback.

## Tracking & Communication
- Update this plan as tasks complete; keep statuses mirrored in GitHub Projects/Issues if used.
- Major requirement shifts must go through `docs/requirements.md` first, then reflected here.

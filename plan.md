# Open Corner on Sui — Execution Plan

Reference: `docs/requirements.md`

## Phase 0 – Repo & Environment
**Goal**: Have a clean Bun + Next.js workspace with lint/test scaffolding and shared UI tooling.
- [x] Initialize Bun workspace (`bun init`) and Next.js App Router project under `/app`.
- [ ] Configure Tailwind + shadcn/ui, base typography, and theme tokens.
- [ ] Set up linting (ESLint), formatting (Prettier), and testing (Vitest + RTL) with `bun run lint|test` scripts.
- [ ] Create `.env.example`, `.editorconfig`, and minimal GitHub Actions workflow for lint/test.

## Phase 1 – Move Foundations (Minimal First)
**Goal**: Ship the smallest viable Move surface (single event, binary markets, SupportVault + Supporter NFT mint) on localnet, then iterate.
- [ ] Scaffold Move workspace under `move/open_corner` with package manifest.
- [ ] Implement MVP-only modules (`fighters`, `support`, `markets`) covering: create fighter, open vault, deposit, mint supporter tier, create binary market, trade, resolve, redeem.
- [ ] Add Move unit tests for the MVP flows; defer perk automation/complex vault logic to stretch issues.
- [ ] Author CLI/Bun scripts to publish package to localnet and seed the single demo event.
- [ ] Dry run Testnet publish; document package ID + capabilities in `docs/requirements.md` and `.env`.

## Phase 2 – Frontend MVP (Rich UI over Minimal Chain)
**Goal**: Deliver the full Fight Week Markets/Support experience with production-quality UI, initially backed by mocks/localnet, wallet connect only.
- [ ] Implement layout, navigation, hero, and persistent tab bar shared across routes.
- [ ] Build `Markets` tab (Promotion Layer): market list, storyline groupings, price card, trade modal, positions drawer (can read from mock/localnet data while Move stabilizes).
- [ ] Build `Support` tab (Sponsorship Layer): fighter carousel, SupportVault meter, Supporter NFT mint/deposit components (UI finished even if transactions mocked).
- [ ] Integrate Sui wallet-kit connect first; abstract auth layer to swap in zkLogin later without UI changes.
- [ ] Implement transaction builders that can operate against mocked/localnet RPC endpoints; gate Sponsored Tx until ready.

## Phase 3 – Integration & Demo Polish
**Goal**: Connect UI to live Sui package, finalize analytics, and script the demo.
- [ ] Swap mocked data for real Sui RPC/GraphQL queries; verify end-to-end trade/deposit/settlement.
- [ ] Implement analytics hooks + dashboard snapshot for liquidity/vault totals.
- [ ] Prepare scripted demo scenario (storyboard, slides, recorded backup video).
- [ ] Final QA pass: accessibility, responsive layouts, error-handling.

## Phase 4 – Stretch Experiments (post-MVP if time remains)
**Goal**: Layer in Sui-native differentiators once CPMM + SupportVault flows are stable.
- [ ] Prototype DeepBookV3-backed markets (replace CPMM liquidity pools with DeepBook order routing, surface maker/taker data in UI).
- [ ] Add advanced SupportVault logic (withdrawal scheduling, perk automation).
- [ ] Evaluate zkLogin integration top-to-bottom and Sponsored Tx UX polish.

## Tracking & Communication
- Update this plan as tasks complete; keep statuses mirrored in GitHub Projects/Issues if used.
- Major requirement shifts must go through `docs/requirements.md` first, then reflected here.

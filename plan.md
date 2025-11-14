# Open Corner on Sui — Execution Plan

Reference: `docs/requirements.md`

## Phase 0 – Repo & Environment
**Goal**: Have a clean Bun + Next.js workspace with lint/test scaffolding and shared UI tooling.
- [ ] Initialize Bun workspace (`bun init`) and Next.js App Router project under `/app`.
- [ ] Configure Tailwind + shadcn/ui, base typography, and theme tokens.
- [ ] Set up linting (ESLint), formatting (Prettier), and testing (Vitest + RTL) with `bun run lint|test` scripts.
- [ ] Create `.env.example`, `.editorconfig`, and minimal GitHub Actions workflow for lint/test.

## Phase 1 – Move Foundations
**Goal**: Deploy baseline `open_corner` Move package with fighters/support/markets modules on localnet.
- [ ] Scaffold Move workspace under `move/open_corner` with package manifest.
- [ ] Implement `fighters`, `support`, `markets` modules plus unit tests per requirements.
- [ ] Author CLI/Bun scripts to publish package to localnet and seed demo data.
- [ ] Dry run Testnet publish; document package ID in `docs/requirements.md` + `.env`.

## Phase 2 – Frontend MVP
**Goal**: Deliver Fight Week event page with Markets/Support tabs wired to mocked data, wallet onboarding, and transaction builders.
- [ ] Implement layout, navigation, and hero components shared across tabs.
- [ ] Build `Markets` tab (Promotion Layer): market list, trade modal, positions drawer.
- [ ] Build `Support` tab (Sponsorship Layer): fighter carousel, SupportVault meter, Supporter NFT mint/deposit flows.
- [ ] Integrate wallet layer (zkLogin + wallet-kit fallback) and transaction builders (mocked or devnet).

## Phase 3 – Integration & Demo Polish
**Goal**: Connect UI to live Sui package, finalize analytics, and script the demo.
- [ ] Swap mocked data for real Sui RPC/GraphQL queries; verify end-to-end trade/deposit/settlement.
- [ ] Implement analytics hooks + dashboard snapshot for liquidity/vault totals.
- [ ] Prepare scripted demo scenario (storyboard, slides, recorded backup video).
- [ ] Final QA pass: accessibility, responsive layouts, error-handling.

## Tracking & Communication
- Update this plan as tasks complete; keep statuses mirrored in GitHub Projects/Issues if used.
- Major requirement shifts must go through `docs/requirements.md` first, then reflected here.

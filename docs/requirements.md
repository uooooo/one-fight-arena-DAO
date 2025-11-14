# Open Corner on Sui — Product & Technical Requirements

## 1. Background & Vision
- **Mission**: Externalize ONE Championship promotion and democratize sponsorship by fusing Fight Week prediction markets with on-chain support vaults for emerging fighters.
- **Primary outcome**: Increase PPV conversions and long-term fandom by giving fans measurable influence over narratives and funding decisions.
- **Hackathon scope**: Ship a Fight Week + SupportVault MVP on Sui Testnet that demonstrates end-to-end flows (login → prediction → support → settlement) for one fighter and a handful of event markets.

## 2. Success Metrics
- ≥ 80% of participating fans can finish onboarding (zkLogin or wallet connect) and place at least one market trade.
- ≥ 70% of active fans mint Supporter NFTs or deposit into SupportVault.
- End-to-end settlement (market resolution + vault fee distribution) completes in < 30 seconds per scenario during the demo.
- Qualitative demo goals: clearly show why Sui objects, zkLogin, and Sponsored Transactions reduce friction versus EVM alternatives.

## 3. Constraints & Non-Goals
- **Tech stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; Bun preferred for tooling; Mysten TypeScript SDK for Sui.
- **Chain**: Sui Testnet only; no mainnet deployment during hackathon.
- **Payments**: No fiat on/off ramp; simulate value with SUI or in-protocol fan points.
- **Regulation**: Prediction markets stay in a closed demo environment (no real-money wagers, clear disclaimers).
- **Non-goals**: full PPV integration, AI story generation, mobile-native app, multi-language localization (provide EN/JA copy hooks only).

## 4. Personas
| Persona | Goals | Motivation | Pain Points |
| --- | --- | --- | --- |
| **Fan** (primary) | Follow Fight Week, speculate, and support a fighter | Influence narratives, unlock perks | Wallet UX, lack of visibility into impact |
| **Fighter / Team** | Showcase SupportVault progress, share updates | Transparent funding, community | Hard to surface story, scattered sponsor data |
| **ONE Ops Admin** | Create markets, resolve outcomes, audit flows | Understand fan demand | Need real-time visibility, compliance |
| **Content Creators** | Embed data widgets, share volatility | Create compelling narratives | Hard to fetch on-chain stats |

## 5. Core User Journeys
1. **Fan onboarding**
   1. Visit landing page → choose event → start login.
   2. Use zkLogin (Google) or connect Sui wallet; backup email stored for win notifications.
   3. Receive demo allocation (`FanPoints`) via Sponsored Tx that covers first predictions + support actions.
2. **Explore fighter & vault**
   1. View FighterProfile (bio, record, training updates, SupportVault balance).
   2. Mint Supporter NFT tier (Bronze/Silver/Gold) to mark intent; Sui object minted via Move call.
   3. Deposit SUI / FanPoints into SupportVault; vault updates UI instantly.
3. **Participate in prediction market**
   1. Select a Fight Week market (e.g., “Fighter makes weight on first attempt”).
   2. Place YES/NO order with constant product AMM; receive PositionNFT representing shares.
   3. Secondary view shows price graph & liquidity (read via GraphQL RPC or aggregator index).
4. **Settlement & reward loop**
   1. Admin resolves market (CLI or dashboard call) and posts result to Sui.
   2. Protocol distributes payouts: winning PositionNFT holders redeem; SupportVault takes configured fee cut that later unlocks perks for fighters.
   3. UI notifies fan; Supporter NFTs reflect new perks (badges, allowlists).
5. **Admin operations**
   1. Create event + markets + initial liquidity via protected Move call (capability gating).
   2. Monitor markets, override or pause when needed, publish settlement proofs.

## 6. Experience Surfaces (Promotion vs Sponsorship)
### 6.1 Fight Week Markets (Promotion Layer)
- Primary route: `/event/[slug]?tab=markets` (default selection).
- Hero shows event banner, countdown, fighter spotlight, and aggregated market stats (total liquidity, price movement).
- Markets list grouped by storyline (Weigh-in, Press, Post-fight). Each card exposes odds, liquidity, and quick action button.
- Drawer/side panel reveals owned PositionNFTs, cost basis, and quick redeem.
- Inline explainer component clarifies “promotion externalization” narrative with links to docs.

### 6.2 Support Vault (Sponsorship Layer)
- Same route toggled via `Support` tab or `/event/[slug]?tab=support`.
- Header reuses event hero but focuses on selected fighter(s) plus SupportVault balance + progress meter.
- CTA stack: “Choose fighter” (carousel) → “Select Supporter NFT tier” → “Deposit / Claim Perks”.
- Vault ledger shows most recent deposits, perk unlock milestones, and outbound usage (training camp, travel, etc.).
- Supporter NFT collection grid renders minted tiers with metadata, share buttons, and “why it matters” copy block.

The tab bar persists at the top of the event detail page so fans can flip contexts without losing scroll position; state syncing keeps wallet balances consistent across both layers.

## 7. MVP Scope vs Stretch
- **On-chain MVP (Move)**: single event, one fighter spotlight, binary CPMM markets with fixed fee, SupportVault that accepts deposits + emits events, Supporter NFT tiers mapped to static metadata (no perk automation), manual market resolution via CLI.
- **DeepBook Stretch**: once CPMM flows are stable, evaluate swapping the market module to route trades through DeepBookV3 (CLOB) so we showcase another Sui-native primitive. Requires integrating DeepBook SDK and handling maker/taker fee semantics.
- **On-chain Stretch**: multi-event registry, complex perk unlock logic, vault withdrawal scheduling, multi-outcome markets, auto-liquidity rebalancing.
- **Wallet MVP**: Sui wallet-kit connect (browser extension / mobile) plus Sponsored Transactions for fees; zkLogin is deferred until base flows stabilize.
- **Frontend Expectation**: even with minimal Move scope, the Markets/Support tabs should feel production-ready (charts, drawers, storytelling blocks). Visual richness is prioritized even if backend interactions are stubbed/mocked early on.

## 8. Functional Requirements
### F1. Event & Fighter Surfacing
- List current Fight Week event(s) with countdowns and highlight fighters participating in MVP.
- Each fighter card pulls from `FighterProfile` (on-chain) plus editorial metadata stored in JSON (Sanity-like or local file) for fallback.
- Event detail page renders a two-tab interface (`Markets`, `Support`) so users can switch between Promotion/Sponsorship layers without leaving the route.
- Support "Spotlight" slider for trending markets based on liquidity/volume metrics.

### F2. Wallet & Identity Layer
- Phase 1: integrate wallet-kit connect (`@mysten/wallet-kit`) with support for Sui extension wallets; capture connected address + network.
- Phase 2 (stretch): add zkLogin based on Mysten docs; keep interfaces agnostic so both auth methods share the same session store.
- Persist lightweight session (NextAuth or custom) keyed by Sui address + email alias.
- Sponsored Transactions for deposits/trades during demo (per docs: `TransactionBlock` builder + sponsor signature flow).

### F3. SupportVault & Supporter NFTs
- MVP Move functions: `create_vault`, `deposit`, `mint_supporter_nft`. `withdraw_by_admin` and `record_perk` can be stubbed/no-ops until stretch.
- UI: tiered CTA (Bronze 5 SUI, Silver 15 SUI, Gold 50 SUI) with dynamic progress bar sourced from on-chain balance.
- Display ledger: contributions, perk unlocks, planned disbursements (off-chain JSON allowed initially; sync to Move events later).

### F4. Prediction Markets (Fight Week)
- Module components: `Event`, `Market`, `OrderBook/Pool`, `PositionNFT`.
- Market types: binary (YES/NO) with CPMM pricing; store `resolve_state`, `liquidity`, `fee_bps`.
- MVP support: create market, add liquidity, trade, resolve, redeem. Slippage + price chart may rely on local calculations/mock data while Move emits essential events.
- Frontend features: order form with slippage warning, price chart, market odds card, share redemption modal.

### F5. Analytics & Telemetry
- Client events (login, deposit, trade, redeem) batched to PostHog or simple server endpoint.
- On-chain watchers via Sui GraphQL to sync vault totals for dashboards.

## 9. Non-Functional Requirements
- **Performance**: Largest interactive route < 200KB JS after code-splitting. Markets refresh every 5s via SWR/polling.
- **Security**: Input validation on deposit sizes, signature domain separation, capability-guarded Move functions. Enforce Content Security Policy for wallet popups.
- **Reliability**: Graceful fallback when RPC fails (retry, show stale data). Provide offline stub for demo.
- **Accessibility**: Keyboard navigable, color contrast ≥ 4.5:1, localized copy strings file for EN/JA.
- **Observability**: Server logs (pino), Move events indexed for debugging.

## 10. On-Chain Design (Move)
- **Modules**: `open_corner::fighters`, `open_corner::support`, `open_corner::markets`.
- **Objects**:
  - `FighterProfile { id, owner, bio_hash, socials, vault_cap }`
  - `SupportVault { id, fighter, balance, tier_config, perks, treasury_cut_bps }`
  - `SupporterNFT { id, fighter, tier, metadata_url, perks }`
  - `Event { id, slug, status, markets: vector<ObjectID> }`
  - `Market { id, event, question, state, pool_yes, pool_no, fee_vault }`
  - `PositionNFT { id, market, outcome, shares, cost_basis }`
- **Capabilities/Access Control**:
  - Genesis admin owns `ProtocolAdminCap` enabling market creation/resolution.
  - `VaultManagerCap` delegated per fighter for team-managed withdrawals.
  - Fans interact permissionlessly with deposit/trade endpoints within guardrails.
- **Events**: `FighterCreated`, `VaultDeposited`, `SupporterMinted`, `MarketTraded`, `MarketResolved`, `PayoutClaimed`.
- **MVP Simplifications**:
  - Single `Event` and limited `Market` count hardcoded in genesis script.
  - `SupporterNFT` metadata stored on-chain as simple string; no dynamic perk updates.
  - Fee vault distributes a flat % to SupportVault on resolution; no progressive tiers yet.
  - No admin dashboard; settlements occur through CLI script calling `resolve_market`.

## 11. Application Architecture
- **Client**: Next.js App Router, React Server Components for data fetching, client components for wallet interactions.
- **Data layer**:
  - `lib/sui/client.ts` exports JSON-RPC + GraphQL clients (per Mysten TypeScript SDK docs).
  - `lib/sui/transactions.ts` includes builders for deposits, trades, settlements.
  - `lib/db` (optional) for caching editorial metadata (could be flat JSON or Supabase instance if time allows).
- **State mgmt**: React Query / SWR for fetch caching; Zustand store for wallet session and optimistic updates.
- **Styling/UI**: Tailwind + shadcn/ui components (Card, Tabs, Dialog, Toast, Skeleton).
- **Testing**: Vitest + React Testing Library for UI; Move unit tests for modules; integration script that spins up local Sui network for e2e.

## 12. Directory Layout (proposal)
```
.
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx (landing/event list)
│  ├─ event/[slug]/page.tsx (markets + fighter tabs)
│  ├─ fighter/[id]/page.tsx
│  ├─ admin/
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  └─ api/
│     └─ notifications/route.ts (email/webhook)
├─ components/
│  ├─ ui/ (shadcn clones)
│  ├─ market/
│  ├─ vault/
│  └─ shared/
├─ features/
│  ├─ onboarding/
│  ├─ markets/
│  └─ support-vault/
├─ lib/
│  ├─ sui/
│  │  ├─ client.ts
│  │  ├─ transactions.ts
│  │  └─ queries.ts
│  ├─ auth/
│  ├─ analytics/
│  └─ utils/
├─ move/
│  └─ open_corner/
│     ├─ fighters.move
│     ├─ support.move
│     └─ markets.move
├─ scripts/
│  ├─ crawl_sdk_typescript_docs.py
│  ├─ seed-markets.ts
│  └─ resolve-market.ts
├─ docs/
│  ├─ requirements.md (this file)
│  ├─ hackathon-idea.md
│  └─ scraped/
└─ packages/
   └─ ui/ (optional shared lib if time allows)
```

## 13. Delivery Milestones
| Phase | Scope | Key Outputs |
| --- | --- | --- |
| **M0 – Environment (Day 0)** | Bun toolchain, Next.js baseline, shadcn setup, lint/test scaffolding | Repo bootstrapped, CI running lint/test | 
| **M1 – On-chain foundations (Day 1)** | Move modules for fighters, vaults, markets; localnet tests; CLI scripts | Published Move package ID on Testnet |
| **M2 – Frontend MVP (Day 2)** | Wallet onboarding, fighter detail, market view, deposit/trade flows | Demo-ready UI with mocked data |
| **M3 – Integration & Settlement (Day 3)** | Hook UI to live Sui package, settlement dashboard, analytics, polish | Storyboarded demo + walkthrough video |

## 14. Future Extensions (Pitch Only)
- PPV affiliate tracking via dynamic NFT passes.
- AI-powered story prompts and scouting index overlays.
- Native mobile experience + push notifications.
- Multi-event marketplace with community governance over upcoming cards.

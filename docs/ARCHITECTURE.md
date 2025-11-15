# ONE Fight Arena DAO - アーキテクチャ図

## システム全体アーキテクチャ

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js App Router]
        B[React Components]
        C[Wallet Kit]
        D[UI Components]
        A --> B
        A --> C
        B --> D
    end

    subgraph "Sui Blockchain"
        E[Move Contracts]
        F[Fighters Module]
        G[Support Vault Module]
        H[Markets Module]
        I[Market Pool Module]
        E --> F
        E --> G
        E --> H
        E --> I
    end

    subgraph "Data Layer"
        J[Sui JSON-RPC]
        K[GraphQL RPC<br/>Stretch Goal]
        L[Local State]
        M[React Query/SWR]
    end

    subgraph "User Actions"
        N[Connect Wallet]
        O[Support Fighter]
        P[Trade Markets]
        Q[View Events]
    end

    A --> J
    C --> E
    B --> M
    M --> J
    J --> E
    
    N --> C
    O --> G
    P --> H
    Q --> A

    style A fill:#1e40af,color:#fff
    style E fill:#00d4aa,color:#000
    style J fill:#9333ea,color:#fff
```

## データフロー図

```mermaid
sequenceDiagram
    participant U as User
    participant W as Wallet
    participant F as Frontend
    participant S as Sui RPC
    participant C as Move Contracts

    Note over U,C: Support Fighter Flow
    U->>F: Click Support Button
    F->>W: Request Transaction
    W->>F: Sign Transaction
    F->>S: Submit Transaction
    S->>C: Execute deposit_to_vault
    C->>C: Update Vault State
    C->>C: Mint Supporter NFT
    C->>S: Return Transaction Result
    S->>F: Update UI State
    F->>U: Show Success Message

    Note over U,C: Trade Market Flow
    U->>F: Place Order
    F->>W: Request Transaction
    W->>F: Sign Transaction
    F->>S: Submit Transaction
    S->>C: Execute trade_market
    C->>C: Update Pool State
    C->>C: Transfer Coins
    C->>S: Return Transaction Result
    S->>F: Update UI State
    F->>U: Show Trade Confirmation
```

## Move モジュール構造

```mermaid
graph LR
    subgraph "open_corner Package"
        A[fighters.move]
        B[support.move]
        C[markets.move]
        D[market_pool.move]
        E[yes_coin.move]
        F[no_coin.move]
    end

    A -->|Creates| G[Fighter Object]
    B -->|Manages| H[SupportVault]
    C -->|Creates| I[Market Object]
    D -->|Manages| J[MarketPool]
    E -->|Mints| K[YES Coin]
    F -->|Mints| L[NO Coin]

    I --> D
    D --> E
    D --> F
    G --> H

    style A fill:#00d4aa
    style B fill:#00d4aa
    style C fill:#00d4aa
    style D fill:#00d4aa
```

## フロントエンドコンポーネント構造

```mermaid
graph TD
    A[app/]
    A --> B[page.tsx<br/>Landing]
    A --> C[markets/page.tsx]
    A --> D[fighters/page.tsx]
    A --> E[event/[slug]/page.tsx]
    
    F[components/]
    F --> G[market/]
    F --> H[support/]
    F --> I[event/]
    F --> J[ui/]
    
    G --> K[MarketCard]
    G --> L[MarketsTab]
    G --> M[OrderBook]
    G --> N[PlaceOrder]
    
    H --> O[SupportTab]
    H --> P[SupportDialog]
    
    I --> Q[EventCard]
    I --> R[EventList]
    
    L[lib/]
    L --> S[sui/]
    S --> T[client.ts]
    S --> U[transactions.ts]
    S --> V[queries.ts]
    
    style A fill:#1e40af,color:#fff
    style F fill:#9333ea,color:#fff
    style L fill:#059669,color:#fff
```

## CPMM (Constant Product Market Maker) アーキテクチャ

```mermaid
graph TB
    subgraph "Market Pool State"
        A[MarketPool Object]
        A --> B[YES Coin Reserve]
        A --> C[NO Coin Reserve]
        A --> D[Liquidity Provider Shares]
    end

    subgraph "Trading Operations"
        E[Buy YES]
        F[Buy NO]
        G[Add Liquidity]
        H[Remove Liquidity]
    end

    E -->|Uses| I[x * y = k<br/>Formula]
    F -->|Uses| I
    G -->|Mints| D
    H -->|Burns| D

    I --> B
    I --> C

    subgraph "Price Calculation"
        J[Price = Reserve Ratio]
        K[Odds = 1 / Price]
    end

    B --> J
    C --> J
    J --> K

    style A fill:#00d4aa
    style I fill:#fbbf24
    style J fill:#3b82f6
```

## ユーザージャーニー

```mermaid
journey
    title User Journey: Support Fighter & Trade Markets
    section Discovery
      Visit Landing Page: 5: User
      Browse Events: 4: User
      View Fighters: 5: User
    section Engagement
      Connect Wallet: 3: User
      Support Fighter: 5: User
      Receive NFT: 5: System
    section Trading
      View Markets: 4: User
      Place Trade: 4: User
      Execute Transaction: 3: System
      View Results: 5: User
```

## デプロイメントアーキテクチャ

```mermaid
graph TB
    subgraph "Development"
        A[Local Development]
        A --> B[sui move test]
        A --> C[Next.js Dev Server]
    end

    subgraph "Testnet"
        D[Sui Testnet]
        D --> E[Move Package]
        D --> F[Seed Data]
        G[Vercel/Netlify]
        G --> H[Frontend Deploy]
    end

    subgraph "Production"
        I[Sui Mainnet]
        I --> J[Move Package]
        I --> K[Production Data]
        L[CDN]
        L --> M[Frontend]
    end

    A --> D
    D --> I
    C --> G
    G --> L

    style D fill:#00d4aa
    style I fill:#059669
    style G fill:#9333ea
    style L fill:#1e40af,color:#fff
```

## セキュリティモデル

```mermaid
graph LR
    A[User Wallet] -->|Signs| B[Transaction]
    B -->|Validates| C[Sui Validators]
    C -->|Executes| D[Move Contracts]
    D -->|Checks| E[Capabilities]
    E -->|Authorizes| F[State Changes]
    
    G[Admin Cap] -->|Controls| H[Market Creation]
    G -->|Controls| I[Market Resolution]
    
    J[Public Functions] -->|Anyone| K[Trade]
    J -->|Anyone| L[Support]
    
    style C fill:#ef4444,color:#fff
    style E fill:#f59e0b
    style G fill:#8b5cf6
```


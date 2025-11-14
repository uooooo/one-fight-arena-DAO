# Open Corner - ONE Fight Arena DAO Move Package

Move smart contracts for ONE Fight Arena DAO prediction markets and support vaults.

## Modules

- `fighters.move`: Fighter profile management
- `support.move`: Support vault and Supporter NFT functionality
- `yes_coin.move`: YES coin creation for prediction markets
- `no_coin.move`: NO coin creation for prediction markets
- `markets.move`: Prediction market creation, resolution, and redemption

## Building

```bash
sui move build
```

## Testing

```bash
sui move test
```

## Deployment

### Local Network

1. Start a local Sui network:
   ```bash
   RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis
   ```

2. Deploy the package:
   ```bash
   bun run scripts/deploy-package.ts local
   ```

3. The script will:
   - Build the Move package
   - Run tests
   - Switch to local network
   - Request SUI from faucet if needed
   - Publish the package
   - Save the package ID to `PACKAGE_ID.txt` and update `README.md`

### Testnet

1. Ensure you have Testnet SUI tokens:
   ```bash
   sui client switch --env testnet
   sui client faucet
   ```

2. Deploy the package:
   ```bash
   bun run scripts/deploy-package.ts testnet
   ```

3. After deployment, update the package ID in:
   - `app/.env.local` (create if it doesn't exist)
   - `docs/requirements.md`

## Seeding Initial Data

After deploying the package, you can seed initial data:

```bash
bun run scripts/seed-data.ts <network> <package-id> <admin-cap-id>
```

Example:
```bash
bun run scripts/seed-data.ts local 0x123... 0x456...
```

The script will create:
- A demo fighter profile (Rodtang Jitmuangnon)
- A support vault for the fighter
- A demo prediction market (if admin cap ID is provided)

Seed data will be saved to `SEED_DATA.json` in the project root.

## Package ID

`0x7f8925011b3810f6c593e19aad48c5c9e5789de0395584bca356a79e2496868b` (local)


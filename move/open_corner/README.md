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

After deployment to Testnet, update the package ID in:
- `.env` files
- `docs/requirements.md`

## Package ID

(To be updated after Testnet deployment)


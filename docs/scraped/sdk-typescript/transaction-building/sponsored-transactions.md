# Sponsored Transactions | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/transaction-building/sponsored-transactions](https://sdk.mystenlabs.com/typescript/transaction-building/sponsored-transactions)
- Retrieved: 2025-11-14 17:44:10 UTC

---

Sponsored Transactions | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

[Mysten Labs SDKs](/)

Search

`⌘``K`

Sui SDK

TypeScript interfaces for Sui

[GitHub](https://github.com/MystenLabs/ts-sdks)[Discord](https://discord.com/invite/Sui)[Sui TypeScript SDK Quick Start](/typescript)[Install Sui TypeScript SDK](/typescript/install)[Hello Sui](/typescript/hello-sui)[Faucet](/typescript/faucet)[JsonRpcClient](/typescript/sui-client)[SuiGraphQLClient](/typescript/graphql)[SuiGrpcClient](/typescript/grpc)

Transaction building

[Sui Programmable Transaction Basics](/typescript/transaction-building/basics)[Paying for Sui Transactions with Gas Coins](/typescript/transaction-building/gas)[Transaction Intents](/typescript/transaction-building/intents)[Building Offline](/typescript/transaction-building/offline)[Sponsored Transactions](/typescript/transaction-building/sponsored-transactions)

Cryptography

[The `@mysten/sui/utils` package](/typescript/utils)

[BCS](/typescript/bcs)[ZkLogin](/typescript/zklogin)[Transaction Executors](/typescript/executors)[Transaction Plugins](/typescript/plugins)

Migrations

Transaction building

# Sponsored Transactions

The transaction builder can support sponsored transactions by using the `onlyTransactionKind` flag
when building the transaction.

```
const tx = new Transaction();

// ... add some transactions...

const kindBytes = await tx.build({ provider, onlyTransactionKind: true });

// construct a sponsored transaction from the kind bytes
const sponsoredtx = Transaction.fromKind(kindBytes);

// you can now set the sponsored transaction data that is required
sponsoredtx.setSender(sender);
sponsoredtx.setGasOwner(sponsor);
sponsoredtx.setGasPayment(sponsorCoins);
```

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/transaction-building/sponsored-transactions.mdx)

[Building Offline

Previous Page](/typescript/transaction-building/offline)[Key pairs

Next Page](/typescript/cryptography/keypairs)

# Paying for Sui Transactions with Gas Coins | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/transaction-building/gas](https://sdk.mystenlabs.com/typescript/transaction-building/gas)
- Retrieved: 2025-11-14 17:44:08 UTC

---

Paying for Sui Transactions with Gas Coins | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

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

Paying for Sui Transactions with Gas Coins

Transaction building

# Paying for Sui Transactions with Gas Coins

With Programmable Transactions, you can use the gas payment coin to construct coins with a set
balance using `splitCoin`. This is useful for Sui payments, and avoids the need for up-front coin
selection. You can use `tx.gas` to access the gas coin in a transaction, and it is valid as input
for any arguments, as long as it is used
[by-reference](https://docs.sui.io/guides/developer/sui-101/simulating-refs). Practically speaking,
this means you can also add to the gas coin with `mergeCoins` and borrow it for Move functions with
`moveCall`.

You can also transfer the gas coin using `transferObjects`, in the event that you want to transfer
all of your coin balance to another address.

## [Gas configuration](#gas-configuration)

The new transaction builder comes with default behavior for all gas logic, including automatically
setting the gas price, budget, and selecting coins to be used as gas. This behavior can be
customized.

### [Gas price](#gas-price)

By default, the gas price is set to the reference gas price of the network. You can also explicitly
set the gas price of the transaction by calling `setGasPrice` on the transaction builder.

```
tx.setGasPrice(gasPrice);
```

### [Budget](#budget)

By default, the gas budget is automatically derived by executing a dry-run of the transaction
beforehand. The dry run gas consumption is then used to determine a balance for the transaction. You
can override this behavior by explicitly setting a gas budget for the transaction, by calling
`setGasBudget` on the transaction builder.

**Note:** The gas budget is represented in Sui, and should take the gas price of the transaction
into account.

```
tx.setGasBudget(gasBudgetAmount);
```

### [Gas payment](#gas-payment)

By default, the gas payment is automatically determined by the SDK. The SDK selects all of the users
coins that are not used as inputs in the transaction.

The list of coins used as gas payment will be merged down into a single gas coin before executing
the transaction, and all but one of the gas objects will be deleted. The gas coin at the 0-index
will be the coin that all others are merged into.

```
// you need to ensure that the coins do not overlap with any
// of the input objects for the transaction
tx.setGasPayment([coin1, coin2]);
```

Gas coins should be objects containing the coins objectId, version, and digest.

Prop

Type

`objectId``string`

`version``number | string`

`digest``string`

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/transaction-building/gas.mdx)

[Sui Programmable Transaction Basics

Previous Page](/typescript/transaction-building/basics)[Transaction Intents

Next Page](/typescript/transaction-building/intents)

### On this page

[Gas configuration](#gas-configuration)[Gas price](#gas-price)[Budget](#budget)[Gas payment](#gas-payment)

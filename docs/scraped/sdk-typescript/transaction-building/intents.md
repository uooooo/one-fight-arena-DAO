# Transaction Intents | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/transaction-building/intents](https://sdk.mystenlabs.com/typescript/transaction-building/intents)
- Retrieved: 2025-11-14 17:44:08 UTC

---

Transaction Intents | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

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

Transaction Intents

Transaction building

# Transaction Intents

Transaction Intents enable 3rd party SDKs and [Transaction Plugins](../plugins) to more easily add
complex operations to a Transaction. The Typescript SDK currently only includes a single Intent
(CoinWithBalance), but more will be added in the future.

## [The CoinWithBalance intent](#the-coinwithbalance-intent)

The `CoinWithBalance` intent makes it easy to get a coin with a specific balance. For SUI, this has
generally been done by splitting the gas coin:

```
const tx = new Transaction();

const [coin] = tx.splitCoins(tx.gas, [100]);

tx.transferObjects([coin], recipient);
```

This approach works well for SUI, but can't be used for other coin types. The CoinWithBalance intent
solves this by providing a helper function that automatically adds the correct SplitCoins and
MergeCoins commands to the transaction:

```
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

// Setting the sender is required for the CoinWithBalance intent to resolve coins when not using the gas coin
tx.setSender(keypair.toSuiAddress());

tx.transferObjects(
	[
		// Create a SUI coin (balance is in MIST)
		coinWithBalance({ balance: 100 }),
		// Create a coin of another type
		coinWithBalance({ balance: 100, type: '0x123::foo:Bar' }),
	],
	recipient,
);
```

Splitting the gas coin also causes problems for sponsored transactions. When sponsoring
transactions, the gas coin comes from the sponsor instead of the transaction sender. Transaction
sponsors usually do not sponsor transactions that use the gas coin for anything other than gas. To
transfer SUI that does not use the gas coin, you can set the `useGasCoin` option to `false`:

```
const tx = new Transaction();
tx.transferObjects([coinWithBalance({ balance: 100, useGasCoin: false })], recipient);
```

It's important to only set `useGasCoin` option to false for sponsored transactions, otherwise the
coinWithBalance intent may use all the SUI coins, leaving no coins to use for gas.

## [How it works](#how-it-works)

When the `CoinWithBalance` intent is resolved, it will look up the senders owned coins for each type
that needs to be created. It will then find a set of coins with sufficient balance to cover the
desired balance, to combine them into a single coin. This coin is then used in a `SplitCoins`
command to create the desired coin.

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/transaction-building/intents.mdx)

[Paying for Sui Transactions with Gas Coins

Previous Page](/typescript/transaction-building/gas)[Building Offline

Next Page](/typescript/transaction-building/offline)

### On this page

[The CoinWithBalance intent](#the-coinwithbalance-intent)[How it works](#how-it-works)

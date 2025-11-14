# Building Offline | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/transaction-building/offline](https://sdk.mystenlabs.com/typescript/transaction-building/offline)
- Retrieved: 2025-11-14 17:44:09 UTC

---

Building Offline | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

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

# Building Offline

To build a transaction offline (with no `client` required), you need to fully define all of your
input values and gas configuration (see the following example). For pure values, you can provide a
`Uint8Array` which is used directly in the transaction. For objects, you can use the `Inputs` helper
to construct an object reference.

```
import { Inputs } from '@mysten/sui/transactions';

// for owned or immutable objects
tx.object(Inputs.ObjectRef({ digest, objectId, version }));

// for shared objects
tx.object(Inputs.SharedObjectRef({ objectId, initialSharedVersion, mutable }));
```

You can then omit the `client` object when calling `build` on the transaction. Any required data
that is missing throws an error.

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/transaction-building/offline.mdx)

[Transaction Intents

Previous Page](/typescript/transaction-building/intents)[Sponsored Transactions

Next Page](/typescript/transaction-building/sponsored-transactions)

# Web Crypto Signer | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/cryptography/webcrypto-signer](https://sdk.mystenlabs.com/typescript/cryptography/webcrypto-signer)
- Retrieved: 2025-11-14 17:44:06 UTC

---

Web Crypto Signer | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

[Mysten Labs SDKs](/)

Search

`⌘``K`

Sui SDK

TypeScript interfaces for Sui

[GitHub](https://github.com/MystenLabs/ts-sdks)[Discord](https://discord.com/invite/Sui)[Sui TypeScript SDK Quick Start](/typescript)[Install Sui TypeScript SDK](/typescript/install)[Hello Sui](/typescript/hello-sui)[Faucet](/typescript/faucet)[JsonRpcClient](/typescript/sui-client)[SuiGraphQLClient](/typescript/graphql)[SuiGrpcClient](/typescript/grpc)

Transaction building

Cryptography

[Key pairs](/typescript/cryptography/keypairs)[Multi-Signature Transactions](/typescript/cryptography/multisig)[Passkey](/typescript/cryptography/passkey)[Web Crypto Signer](/typescript/cryptography/webcrypto-signer)

[The `@mysten/sui/utils` package](/typescript/utils)

[BCS](/typescript/bcs)[ZkLogin](/typescript/zklogin)[Transaction Executors](/typescript/executors)[Transaction Plugins](/typescript/plugins)

Migrations

Web Crypto Signer

Cryptography

# Web Crypto Signer

For cases where you need to create keypairs directly within client dapps, we recommend using the Web
Crypto Signer. This signer leverages the
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) to provide a
secure and efficient way to generate and manage cryptographic keys in the browser. The generated
keys are `Secp256r1` keys which can be persisted between sessions, and are not extractable by
client-side code (including extensions).

Common use cases for the Web Crypto Signer include:

* zkLogin ephemeral keypairs
* Session-based keypairs

## [Installation](#installation)

To use the Web Crypto Signer, you need to install the `@mysten/signers` package.

```
npm i @mysten/signers
```

You can then import the `WebCryptoSigner` class from the package:

```
import { WebCryptoSigner } from '@mysten/signers/webcrypto';
```

## [Create a new signer](#create-a-new-signer)

To generate a new signer, you can invoke the `generate()` static method on the `WebCryptoSigner`
class.

```
const keypair = await WebCryptoSigner.generate();
```

## [Persisting and recovering the keypair](#persisting-and-recovering-the-keypair)

The private key for the signer is not extractable, but you can persist the keypair using the
browser's IndexedDB storage. To streamline this process, the keypair provides an `export()` method
which returns an object containing the public key and a reference to the private key:

```
// Get the exported keypair:
const exported = keypair.export();

// Write the keypair to IndexedDB.
// This method does not exist, you need to implement it yourself. We recommend `idb-keyval` for simplicity.
await writeToIndexedDB('keypair', exported);
```

You can then recover the keypair by reading it from IndexedDB and passing it to the `import()`
method.

```
// Read the keypair from IndexedDB.
const exported = await readFromIndexedDB('keypair');

const keypair = await WebCryptoSigner.import(exported);
```

Ensure that you do not call `JSON.stringify` on the exported keypair before persisting it to
IndexedDB, as it will throw an error and fail to persist.

## [Usage](#usage)

The usage for a Web Crypto signer is the same as any other keypair. You can derive the public key,
derive the address, sign personal messages, sign transactions and verify signatures. See the
[Key pairs](./keypairs) documentation for more details.

```
const publicKey = keypair.getPublicKey();
const address = publicKey.toSuiAddress();

const message = new TextEncoder().encode('hello world');
await keypair.signPersonalMessage(message);
await keypair.signTransaction(txBytes);
```

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/cryptography/webcrypto-signer.mdx)

[Passkey

Previous Page](/typescript/cryptography/passkey)[The `@mysten/sui/utils` package

Next Page](/typescript/utils)

### On this page

[Installation](#installation)[Create a new signer](#create-a-new-signer)[Persisting and recovering the keypair](#persisting-and-recovering-the-keypair)[Usage](#usage)

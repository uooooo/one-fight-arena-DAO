# Derived Objects | Mysten Labs TypeScript SDK Docs

- Source: [https://sdk.mystenlabs.com/typescript/utils/derived_objects](https://sdk.mystenlabs.com/typescript/utils/derived_objects)
- Retrieved: 2025-11-14 17:44:06 UTC

---

Derived Objects | Mysten Labs TypeScript SDK Docs[Mysten Labs SDKs](/)

[Mysten Labs SDKs](/)

Search

`⌘``K`

Sui SDK

TypeScript interfaces for Sui

[GitHub](https://github.com/MystenLabs/ts-sdks)[Discord](https://discord.com/invite/Sui)[Sui TypeScript SDK Quick Start](/typescript)[Install Sui TypeScript SDK](/typescript/install)[Hello Sui](/typescript/hello-sui)[Faucet](/typescript/faucet)[JsonRpcClient](/typescript/sui-client)[SuiGraphQLClient](/typescript/graphql)[SuiGrpcClient](/typescript/grpc)

Transaction building

Cryptography

[The `@mysten/sui/utils` package](/typescript/utils)

[Derived Objects](/typescript/utils/derived_objects)

[BCS](/typescript/bcs)[ZkLogin](/typescript/zklogin)[Transaction Executors](/typescript/executors)[Transaction Plugins](/typescript/plugins)

Migrations

Derived Objects

[The `@mysten/sui/utils` package](/typescript/utils)

# Derived Objects

Derived objects enable deterministic IDs for objects, enabling offline derivation of object IDs.
[Click here to read more.](https://docs.sui.io/concepts/sui-move-concepts/derived-objects)

To derive an object ID, you can import `deriveObjectID` function exposed from utils.

```
import { deriveObjectID } from '@mysten/sui/utils';
```

To derive any object, you need to have its parent's ID (the object from which it was derived), and
the key used to generate it.

It is recommended to verify the on-chain `derived_object::derive_address` match your off-chain
calculation (at least once when implementing offline calculations), especially for critical cases
like transferring assets.

## [Deriving using primitive keys](#deriving-using-primitive-keys)

To derive the IDs using primitive types, you can use the built-in types like this, assuming you have
a parent object with ID `0xc0ffee`.

```
// Example 1: On-chain derivation for `0xc0ffee + vector<u8>([0,1,2])
deriveObjectID('0xc0ffee', 'vector<u8>', bcs.vector(bcs.u8()).serialize([0, 1, 2]).toBytes());

// Example 2: On-chain derivation for `0xc0ffee + address('0x111')`
deriveObjectID('0xc0ffee', 'address', bcs.Address.serialize('0x111').toBytes());

// Example 3: On-chain derivation for `0xc0ffee + non-ascii string ("foo")`
deriveObjectID('0xc0ffee', '0x1::string::String', bcs.String.serialize('foo').toBytes());
```

## [Deriving using custom types](#deriving-using-custom-types)

To derive IDs using your custom objects, you can use BCS & the known type IDs.

Assuming a custom struct on-chain (for the key) being:

```
public struct DemoStruct has copy, store, drop { value: u64 }
```

you can derive it by doing:

```
// Assuming we wanted to derive for key `DemoStruct { value: 1 }`.
const bcsType = bcs.struct('DemoStruct', {
	value: bcs.u64(),
});

const key = bcsType.serialize({ value: 1 }).toBytes();

// Derive the object ID for the key `DemoStruct { value: 1 }`.
deriveObjectID('0xc0ffee', `0xc0ffee::demo::DemoStruct`, key);
```

[Edit on GitHub](https://github.com/MystenLabs/ts-sdks/blob/main/packages/docs/content/typescript/utils/derived_objects.mdx)

[The `@mysten/sui/utils` package

Previous Page](/typescript/utils)[BCS

Next Page](/typescript/bcs)

### On this page

[Deriving using primitive keys](#deriving-using-primitive-keys)[Deriving using custom types](#deriving-using-custom-types)

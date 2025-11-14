# Sui Framework Reference

- Source: [https://docs.sui.io/references/framework](https://docs.sui.io/references/framework)
- Original Title: Sui Framework | Sui Documentation
- Retrieved: 2025-11-14 17:31:18 UTC

---

Sui Framework | Sui Documentation

[Skip to main content](#__docusaurus_skipToContent_fallback)

[![Sui Docs Logo](/img/sui-logo.svg)![Sui Docs Logo](/img/sui-logo.svg)

**Sui Documentation**](/)

[Guides](/guides)[Concepts](/concepts)[Standards](/standards)[References](/references)

Search

* [Overview](/references)
* [Sui RPC](/references/sui-api)

  + [GraphQL](/references/sui-graphql)
  + [JSON-RPC](/sui-api-ref)
  + [Sui Full Node gRPC](/references/fullnode-protocol)
  + [RPC Best Practices](/references/sui-api/rpc-best-practices)
* [Sui CLI](/references/cli)

  + [Sui CLI Cheat Sheet](/references/cli/cheatsheet)
  + [Sui Client CLI](/references/cli/client)
  + [Sui Client PTB CLI](/references/cli/ptb)
  + [Sui Keytool CLI](/references/cli/keytool)
  + [Sui Move CLI](/references/cli/move)
  + [Sui Replay CLI](/references/cli/replay)
  + [Sui Trace Analysis](/references/cli/trace-analysis)
  + [Sui Validator CLI](/references/cli/validator)
* [Sui IDE Support](/references/ide/move)

  + [Move Analyzer](/references/ide/move)
  + [Move Trace Debugger](/references/ide/debugger)
* [Sui SDKs](/references/sui-sdks)

  + [dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
  + [Rust SDK](/references/rust-sdk)
  + [TypeScript SDK](https://sdk.mystenlabs.com/typescript)
  + [zkSend SDK](https://sdk.mystenlabs.com/zksend)
* [Move](/references/sui-move)

  + [Framework](/references/framework)

    - [bridge](/references/framework/sui_bridge)
    - [std](/references/framework/sui_std)
    - [sui](/references/framework/sui_sui)
    - [system](/references/framework/sui_sui_system)
  + [The Move Book](https://move-book.com/)
  + [The Move Reference](https://move-book.com/reference/)
* [Awesome Sui](/references/awesome-sui)
* [Glossary](/sui-glossary)
* [Contribute](/references/contribute/contribution-process)

🗳️Book Office Hours→[💬Join Discord→](https://discord.gg/sui)

* [Move](/references/sui-move)
* Framework

On this page

# Sui Framework

The documentation in this section is created from the Rust `cargo doc` process. The process builds the content from comments in the source code.

## Framework documentation[​](#framework-documentation "Direct link to Framework documentation")

The child pages to this topic describe the module members for the following libraries:

* [`bridge`](/references/framework/sui_bridge)
* [`std`](/references/framework/sui_std)
* [`sui`](/references/framework/sui_sui)
* [`sui_system`](/references/framework/sui_sui_system)

## Source code[​](#source-code "Direct link to Source code")

You can find the source code for these Move modules in the [crates/sui-framework/packages](https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages) directory in the `sui` repository on GitHub. As previously mentioned, the comments included in the code provide context for the logic defined.

## Crate documentation[​](#crate-documentation "Direct link to Crate documentation")

You can review the raw `cargo doc` output of the following documentation in the `sui` repository. The .md files are located in the `crates/sui-framework/docs` directory. Online, they are located at <https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/docs>.

## Build documentation locally[​](#build-documentation-locally "Direct link to Build documentation locally")

The most recent documentation is always available in the `main` branch of the `sui` repository. You shouldn't need to build the documentation locally, but if the need arises you can:

1. Open a terminal or console to the `sui/crates/sui-framework` directory.
2. Run `cargo doc --workspace --exclude "sui-benchmark" --no-deps`.
3. The docs are built to `crates/sui-framework/docs` into their respective subdirectories.

info

If the `cargo doc` process does not work as expected, try running `cargo clean` before attempting again.

[Edit this page](https://github.com/MystenLabs/sui/tree/main/docs/docs/../content/references/framework.mdx)

[Previous

Move References](/references/sui-move)[Next

sui:bridge](/references/framework/sui_bridge)

* [Framework documentation](#framework-documentation)
* [Source code](#source-code)
* [Crate documentation](#crate-documentation)
* [Build documentation locally](#build-documentation-locally)

[![Sui Logo](/img/sui-logo-footer.svg)![Sui Logo](/img/sui-logo-footer.svg)](https://sui.io)

© 2025 Sui Foundation | Documentation distributed under [CC BY 4.0](https://github.com/MystenLabs/sui/blob/main/docs/site/LICENSE)

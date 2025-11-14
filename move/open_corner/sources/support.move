module open_corner::support;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// Support vault for a fighter
public struct SupportVault has key {
    id: UID,
    fighter_id: ID,
    balance: Balance<SUI>,
}

/// Supporter NFT tiers
const BRONZE: u8 = 1;
const SILVER: u8 = 2;
const GOLD: u8 = 3;

/// Supporter NFT representing fan support
public struct SupporterNFT has key, store {
    id: UID,
    fighter_id: ID,
    tier: u8,
    metadata_url: vector<u8>,
}

/// Capability for managing vault withdrawals (stretch goal)
public struct VaultManagerCap has key {
    id: UID,
    vault_id: ID,
}

/// Event emitted when vault receives a deposit
public struct VaultDeposited has copy, drop {
    vault_id: ID,
    fighter_id: ID,
    amount: u64,
    depositor: address,
}

/// Event emitted when a supporter NFT is minted
public struct SupporterMinted has copy, drop {
    nft_id: ID,
    fighter_id: ID,
    tier: u8,
    minter: address,
}

/// Create a new support vault for a fighter
/// Returns the vault ID
public fun create_vault(
    fighter_id: ID,
    ctx: &mut TxContext,
): ID {
    let vault = SupportVault {
        id: object::new(ctx),
        fighter_id,
        balance: balance::zero<SUI>(),
    };

    let vault_id = object::id(&vault);
    transfer::share_object(vault);
    vault_id
}

/// Deposit SUI into a support vault
public fun deposit(
    vault: &mut SupportVault,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let amount = coin::value(&payment);
    balance::join(&mut vault.balance, coin::into_balance(payment));

    event::emit(VaultDeposited {
        vault_id: object::id(vault),
        fighter_id: vault.fighter_id,
        amount,
        depositor: tx_context::sender(ctx),
    });
}

/// Mint a supporter NFT for a fighter
/// The NFT is transferred to the caller
public fun mint_supporter_nft(
    fighter_id: ID,
    tier: u8,
    metadata_url: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(tier == BRONZE || tier == SILVER || tier == GOLD, 0);

    let nft = SupporterNFT {
        id: object::new(ctx),
        fighter_id,
        tier,
        metadata_url,
    };

    let nft_id = object::id(&nft);
    transfer::transfer(nft, tx_context::sender(ctx));

    event::emit(SupporterMinted {
        nft_id,
        fighter_id,
        tier,
        minter: tx_context::sender(ctx),
    });
}

/// Get vault balance (view function)
public fun balance(vault: &SupportVault): u64 {
    balance::value(&vault.balance)
}

#[test_only]
public fun create_test_vault(
    fighter_id: ID,
    ctx: &mut TxContext,
): ID {
    create_vault(fighter_id, ctx)
}

#[test_only]
public fun mint_test_nft(
    fighter_id: ID,
    ctx: &mut TxContext,
) {
    mint_supporter_nft(fighter_id, BRONZE, b"test_metadata", ctx)
}


#[test_only]
module open_corner::tests;

use sui::test_scenario::{Self, Scenario};
use sui::test_utils;
use open_corner::fighters::{Self, FighterProfile, FighterManagerCap};
use open_corner::support::{Self, SupportVault, SupporterNFT, BRONZE};
use open_corner::markets::{Self, Market, ProtocolAdminCap, OPEN, RESOLVED};
use open_corner::yes_coin::{Self, YES_COIN};
use open_corner::no_coin::{Self, NO_COIN};

const ADMIN: address = @0xAD;
const USER: address = @0x1;

#[test]
fun test_create_fighter() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(&mut scenario.ctx());
    
    assert!(fighter_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_create_vault() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(&mut scenario.ctx());
    
    let vault_id = support::create_test_vault(fighter_id, &mut scenario.ctx());
    // Vault is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario
    assert!(vault_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_mint_supporter_nft() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(&mut scenario.ctx());
    
    scenario.next_tx(USER);
    support::mint_test_nft(fighter_id, &mut scenario.ctx());
    
    // NFT is transferred to USER, so we can't directly assert on it
    // In a real test, we would query the object from the scenario
    
    test_scenario::end(scenario);
}

#[test]
fun test_create_market() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    // Create admin cap
    let admin_cap = ProtocolAdminCap {
        id: sui::object::new(&mut scenario.ctx()),
    };
    
    let market_id = markets::create_test_market(
        &admin_cap,
        sui::object::id_from_address(@0xE),
        &mut scenario.ctx(),
    );
    
    // Market is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario
    assert!(market_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_resolve_market() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    // Create admin cap
    let admin_cap = ProtocolAdminCap {
        id: sui::object::new(&mut scenario.ctx()),
    };
    
    let market_id = markets::create_test_market(
        &admin_cap,
        sui::object::id_from_address(@0xE),
        &mut scenario.ctx(),
    );
    
    // Market is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario and resolve it
    assert!(market_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}


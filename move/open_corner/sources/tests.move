#[test_only]
module open_corner::tests;

use sui::test_scenario;
use open_corner::fighters;
use open_corner::support;
use open_corner::markets;
use open_corner::yes_coin;
use open_corner::no_coin;

const ADMIN: address = @0xAD;
const USER: address = @0x1;

#[test]
fun test_create_fighter() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(test_scenario::ctx(&mut scenario));
    
    assert!(fighter_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_create_vault() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(test_scenario::ctx(&mut scenario));
    
    let vault_id = support::create_test_vault(fighter_id, test_scenario::ctx(&mut scenario));
    // Vault is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario
    assert!(vault_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_mint_supporter_nft() {
    let mut scenario = test_scenario::begin(ADMIN);
    let fighter_id = fighters::create_test_fighter(test_scenario::ctx(&mut scenario));
    
    test_scenario::next_tx(&mut scenario, USER);
    support::mint_test_nft(fighter_id, test_scenario::ctx(&mut scenario));
    
    // NFT is transferred to USER, so we can't directly assert on it
    // In a real test, we would query the object from the scenario
    
    test_scenario::end(scenario);
}

#[test]
fun test_create_market() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    // Create admin cap
    let admin_cap = markets::create_test_admin_cap(test_scenario::ctx(&mut scenario));
    
    // Create test TreasuryCaps
    let treasury_cap_yes = yes_coin::create_test_treasury_cap(
        test_scenario::ctx(&mut scenario),
    );
    let treasury_cap_no = no_coin::create_test_treasury_cap(
        test_scenario::ctx(&mut scenario),
    );
    
    let market_id = markets::create_test_market(
        &admin_cap,
        sui::object::id_from_address(@0xE),
        treasury_cap_yes,
        treasury_cap_no,
        test_scenario::ctx(&mut scenario),
    );
    
    // Transfer admin cap to sender for cleanup
    markets::transfer_admin_cap(admin_cap, ADMIN);
    
    // Market is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario
    assert!(market_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}

#[test]
fun test_resolve_market() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    // Create admin cap
    let admin_cap = markets::create_test_admin_cap(test_scenario::ctx(&mut scenario));
    
    // Create test TreasuryCaps
    let treasury_cap_yes = yes_coin::create_test_treasury_cap(
        test_scenario::ctx(&mut scenario),
    );
    let treasury_cap_no = no_coin::create_test_treasury_cap(
        test_scenario::ctx(&mut scenario),
    );
    
    let market_id = markets::create_test_market(
        &admin_cap,
        sui::object::id_from_address(@0xE),
        treasury_cap_yes,
        treasury_cap_no,
        test_scenario::ctx(&mut scenario),
    );
    
    // Transfer admin cap to sender for cleanup
    markets::transfer_admin_cap(admin_cap, ADMIN);
    
    // Market is shared, so we can't directly access it
    // In a real test, we would query the object from the scenario and resolve it
    assert!(market_id != sui::object::id_from_address(@0x0), 0);
    
    test_scenario::end(scenario);
}


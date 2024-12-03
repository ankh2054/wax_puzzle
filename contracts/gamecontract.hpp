#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/print.hpp>

using namespace eosio;

class [[eosio::contract("gamecontract")]] gamecontract : public contract {
public:
    using contract::contract;

    // Constructor
    gamecontract(name receiver, name code, datastream<const char*> ds)
        : contract(receiver, code, ds) {}

    // Public actions
    [[eosio::action]]
    void validateqfee(name user, asset fee);

    [[eosio::action]]
    void startgame(name user);

    [[eosio::action]]
    void updchallenge(name user, uint8_t challenge_id);

    [[eosio::action]]
    void transfer(name user);

    [[eosio::on_notify("eosio.token::transfer")]]
    void on_transfer(name from, name to, asset quantity, std::string memo);

private:
    // Constants
    const asset MIN_FEE = asset(10000, symbol("WAX", 4)); // Minimum per-question fee: 0.1000 WAX

    // Game table
    struct [[eosio::table]] game {
        name user;          // Player's WAX account
        bool challenge1;    // Challenge 1 status
        bool challenge2;    // Challenge 2 status
        bool challenge3;    // Challenge 3 status

        uint64_t primary_key() const { return user.value; }
    };
    typedef multi_index<"games"_n, game> game_table;

    // Prize pool table
    struct [[eosio::table]] prize_pool {
        uint64_t id;        // Singleton ID (always 0)
        asset amount;       // Prize pool amount

        uint64_t primary_key() const { return id; }
    };
    typedef multi_index<"prizepool"_n, prize_pool> prize_pool_table;
};
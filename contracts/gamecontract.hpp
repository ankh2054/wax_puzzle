#pragma once
#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>

using namespace eosio;

class [[eosio::contract("gamecontract")]] gamecontract : public contract {
public:
    using contract::contract;

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

    [[eosio::action]]
    void removegame(name user);

private:
    const asset MIN_FEE = asset(100000000, symbol("WAX", 8));  // 1.00000000 WAX

    struct [[eosio::table]] game {
        name user;
        bool challenge1;
        bool challenge2;
        bool challenge3;
        uint32_t game_entries;
        uint32_t entries_used;

        uint64_t primary_key() const { return user.value; }
    };
    typedef multi_index<"games"_n, game> game_table;

    struct [[eosio::table]] prize_pool {
        uint64_t id;
        asset amount;

        uint64_t primary_key() const { return id; }
    };
    typedef multi_index<"prizepool"_n, prize_pool> prize_pool_table;
};

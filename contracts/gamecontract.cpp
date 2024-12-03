#include "gamecontract.hpp"

// Validate Fee for a Question
void gamecontract::validateqfee(name user, asset fee) {
    require_auth(user);

    check(fee >= MIN_FEE, "Fee does not meet the minimum requirement.");
    check(fee.symbol == MIN_FEE.symbol, "Fee must be in WAX.");

    print("Question fee validated for user: ", user);
}

// Start a new game
void gamecontract::startgame(name user) {
    require_auth(get_self());

    game_table games(get_self(), get_self().value);
    auto itr = games.find(user.value);
    check(itr == games.end(), "User already has an active game. Finish it before starting a new one.");

    games.emplace(get_self(), [&](auto& row) {
        row.user = user;
        row.challenge1 = false;
        row.challenge2 = false;
        row.challenge3 = false;
    });

    print("Game started for user: ", user);
}

// Update challenge status
void gamecontract::updchallenge(name user, uint8_t challenge_id) {
    require_auth(get_self());

    game_table games(get_self(), get_self().value);
    auto itr = games.find(user.value);
    check(itr != games.end(), "Game not found for user.");

    games.modify(itr, get_self(), [&](auto& row) {
        switch (challenge_id) {
            case 1:
                row.challenge1 = true;
                break;
            case 2:
                row.challenge2 = true;
                break;
            case 3:
                row.challenge3 = true;
                break;
            default:
                check(false, "Invalid challenge ID.");
        }
    });

    print("Challenge ", challenge_id, " updated for user: ", user);
}

// Claim prize
void gamecontract::transfer(name user) {
    require_auth(user);

    game_table games(get_self(), get_self().value);
    auto itr = games.find(user.value);
    check(itr != games.end(), "Game not found for user.");
    check(itr->challenge1 && itr->challenge2 && itr->challenge3, "Not all challenges are complete.");

    prize_pool_table pool(get_self(), get_self().value);
    auto pool_itr = pool.find(0);
    check(pool_itr != pool.end(), "Prize pool not found.");
    check(pool_itr->amount.amount > 0, "Prize pool is empty.");

    // Transfer the available prize amount
    action(
        permission_level{get_self(), "active"_n},
        "eosio.token"_n,
        "transfer"_n,
        std::make_tuple(get_self(), user, pool_itr->amount, std::string("Congratulations on winning!"))
    ).send();

    // Reset prize pool after transfer
    pool.modify(pool_itr, get_self(), [&](auto& row) {
        row.amount = asset(0, MIN_FEE.symbol);
    });

    games.erase(itr);

    print("Prize of ", pool_itr->amount, " transferred to user: ", user);
}

// Handle fee transfers
void gamecontract::on_transfer(name from, name to, asset quantity, std::string memo) {
    if (to != get_self()) return;

    check(quantity >= MIN_FEE, "Transfer does not meet the minimum fee requirement.");
    check(quantity.symbol == MIN_FEE.symbol, "Transfer must be in WAX.");

    // Calculate 70% for prize pool
    asset prize_amount = asset(quantity.amount * 70 / 100, quantity.symbol);

    prize_pool_table pool(get_self(), get_self().value);
    auto pool_itr = pool.find(0);
    if (pool_itr == pool.end()) {
        pool.emplace(get_self(), [&](auto& row) {
            row.id = 0;
            row.amount = prize_amount;
        });
    } else {
        pool.modify(pool_itr, get_self(), [&](auto& row) {
            row.amount += prize_amount;
        });
    }

    print("Fee received: ", quantity, " (", prize_amount, " added to prize pool) from user: ", from);
}

void gamecontract::removegame(name user) {
    require_auth(get_self());  // Only contract account can remove games

    game_table games(get_self(), get_self().value);
    auto itr = games.find(user.value);
    check(itr != games.end(), "Game not found for user.");

    games.erase(itr);
    print("Game removed for user: ", user);
}
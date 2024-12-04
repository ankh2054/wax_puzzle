This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Testing the Contract

### Contract Tables

#### 1. Games Table (`games`)
Stores all active games and entry counts.

Fields:
- `user` (name) - Player's WAX account (primary key)
- `challenge1` (bool) - Status of first challenge
- `challenge2` (bool) - Status of second challenge
- `challenge3` (bool) - Status of third challenge
- `game_entries` (uint32) - Total number of paid entries
- `entries_used` (uint32) - Number of entries used




### Game Flow
1. User logs in through the frontend
2. User is required to pay a fee for each question directed to the LLM
3. Frontend validates the minimum fee (1.00000000 WAX) using `validateqfee`
3. User pays the fee via token transfer
4. User can start the game
5. For each correct answer, the contract account (not the user) updates the challenge status.



### Test Commands

#### 1. Validate Fee (Frontend Security Check)

   `cleos push action sentnlagents validateqfee '["sentnltestin", "1.00000000 WAX"]' -p sentnltestin@active`


#### 2. Pay Fee and Get Entries

- Creates or updates user's game record
- Adds entries (1 WAX = 1 entry)
- 70% goes to prize pool

   User transfers 1 WAX to the contract account

#### 3. Start a new game

Note: Will fail if user already has a game record

   `cleos push action sentnlagents startgame '["sentnltestin", "0"]' -p sentnlagents@active`

#### 4. Update challenge

Each time a user solves a challenge, the challenge number is updated with True on the contract tables.

Challange1:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "1"]' -p sentnlagents@active`

Challange2:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "2"]' -p sentnlagents@active`

Challange3:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "3"]' -p sentnlagents@active`


#### 5. Claim prize

- Requires all challenges to be complete
- Transfers entire prize pool to winner
- Removes user's game record

Once all the challenges are solved, the user can claim the prize.

   `cleos push action sentnlagents claimprize '["sentnltestin"]' -p sentnltestin@active`


#### 6. Remove player from game

If for any reason a player wants to leave the game, the contract account can remove the player.

   `cleos push action sentnlagents removegame '["sentnltestin"]' -p sentnlagents@active`

#### 7. Use game entries

The user can use game entries to solve challenges.

   `cleos push action sentnlagents useentry '["sentnltestin", 1]' -p sentnlagents@active`

### Important Notes
- Users can't start a new game if they already have a game record
- Game entries accumulate with every 1 WAX token send as payment.
- Only the contract account can update challenge status and remove games
- Prize pool is shared among all players and cleared when claimed



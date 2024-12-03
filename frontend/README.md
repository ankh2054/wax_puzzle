This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Testing the Contract

### Game Flow
1. User logs in through the frontend
2. User is required to pay a fee for each question directed to the LLM
3. Frontend validates the minimum fee (1.00000000 WAX) using `validateqfee`
3. User pays the fee via token transfer
4. After first sucesfull payment game starts.
5. For each correct answer, the contract account (not the user) updates the challenge status

### Test Commands

#### 1. Validate Fee (Frontend Security Check)

   `cleos push action sentnlagents validateqfee '["sentnltestin", "1.00000000 WAX"]' -p sentnltestin@active`

#### Start a new game

   `cleos push action sentnlagents startgame '["sentnltestin", "0"]' -p sentnltestin@active`

#### Update challenge

Each time a user solves a challenge, the challenge number is updated with True on the contract tables.

Challange1:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "1"]' -p sentnlagents@active`

Challange2:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "2"]' -p sentnlagents@active`

Challange3:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "3"]' -p sentnlagents@active`


#### Claim prize

Once all the challenges are solved, the user can claim the prize.

   `cleos push action sentnlagents claimprize '["sentnltestin"]' -p sentnltestin@active`



#### Remove player from game

If for any reason a player wants to leave the game, the contract account can remove the player.
   `cleos push action sentnlagents removegame '["sentnltestin"]' -p sentnlagents@active`



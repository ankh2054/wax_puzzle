This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Testing the contract


In order for a player to start a game they need to furst pay the minimum fee.

transfer sentnltestin sentnlagents "0.1000 WAX" "payment memo"



#### VAlidate Fee 

   `cleos push action sentnlagents validateqfee '["sentnltestin", "0.1000 WAX"]' -p sentnltestin@active`

#### Start a new game

   `cleos push action sentnlagents startgame '["sentnltestin", "0"]' -p sentnltestin@active`

#### Update challenge

Each time a user solves a challenge, the challenge number is updated with True on the contract tables.

Challange1:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "1"]' -p sentnltestin@active`

Challange2:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "2"]' -p sentnltestin@active`

Challange3:

   `cleos push action sentnlagents updchallenge '["sentnltestin", "3"]' -p sentnltestin@active`


#### Claim prize

Once all the challenges are solved, the user can claim the prize.

   `cleos push action sentnlagents claimprize '["sentnltestin"]' -p sentnltestin@active`



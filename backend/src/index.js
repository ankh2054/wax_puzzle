require('dotenv/config')
const Fastify = require('fastify')
const cors = require('@fastify/cors')
const { Session } = require('@wharfkit/session')
const { WalletPluginPrivateKey } = require('@wharfkit/wallet-plugin-privatekey')
const { SigningRequest } = require('@wharfkit/signing-request')
const { PermissionLevel, Signature } = require('@wharfkit/session')
const { APIClient } = require('@wharfkit/antelope')

const fastify = Fastify({ logger: true })
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
})

const httpurl = process.env.WAX_RPC_URL || 'https://testnet.waxsweden.org'
const actingActor = process.env.WAX_CONTRACT_ACCOUNT || 'sentnlagents'
const privateKey = process.env.CONTRACT_PRIVATE_KEY 
if (!privateKey) {
  throw new Error('CONTRACT_PRIVATE_KEY environment variable is required')
}

const args = {
  chain: {
    id: process.env.WAX_CHAIN_ID || 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    url: httpurl
  },
  actor: actingActor,
  permission: 'active',
  walletPlugin: new WalletPluginPrivateKey(privateKey),
}

const contractSession = new Session(args)

const verifySession = async (request, reply) => {
  const authHeader = request.headers.authorization
  console.log('Starting verification for request:', request.body)
  
  if (!authHeader) {
    reply.code(401).send({ error: 'No authorization header' })
    return
  }

  try {
    const [, token] = authHeader.split(' ')
    if (!token) {
      throw new Error('No token provided')
    }
    
    const [transactionId, signatureString] = token.split(':')
    console.log('Verifying transaction:', { transactionId, signatureString })
    
    if (!transactionId || !signatureString) {
      throw new Error('Invalid token format')
    }
    
    const client = new APIClient({ url: httpurl })
    const startTime = Date.now()
    const timeout = 10000 // 10 seconds
    
    while (true) {
      try {
        const transaction = await client.v1.history.get_transaction(transactionId)
        //console.log('Transaction data:', transaction?.traces?.[0]?.act)
        
        if (transaction?.traces?.[0]?.act?.authorization?.[0]?.actor) {
          const transactionActor = transaction.traces[0].act.authorization[0].actor
          const requestedUser = request.body.user

          //console.log('Comparing users:', { transactionActor, requestedUser })
          
          if (transactionActor !== requestedUser) {
            throw new Error('Transaction actor does not match requested user')
          }

          request.user = transactionActor
          return 
        }
      } catch (error) {
        //console.log('Transaction not found yet, retrying...')
      }

      // Check if we've exceeded timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Transaction verification timed out after 10 seconds')
      }

      // Wait 1 second before trying again
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.error('Verification error:', error)
    reply.code(401).send({ error: 'Invalid session: ' + error.message })
    return
  }
}

const verifyGameCompletion = async (user) => {
  try {
    const response = await fetch(`${httpurl}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: true,
        code: actingActor,
        scope: actingActor,
        table: 'games',
        lower_bound: user,
        upper_bound: user,
        limit: 1
      })
    })

    const data = await response.json()
    if (!data.rows.length) {
      throw new Error('Game not found')
    }

    const game = data.rows[0]
    if (!game.challenge1 || !game.challenge2 || !game.challenge3) {
      throw new Error('Not all challenges are complete')
    }

    return true
  } catch (error) {
    throw error
  }
}

fastify.post('/updateChallenge', {
  preHandler: verifySession,
  handler: async (request, reply) => {
    const { user, challengeId } = request.body
    
    if (request.user !== user) {
      reply.code(403).send({ error: 'Unauthorized' })
      return
    }
    if (request.user !== user){
      reply.code(200).send({ success: 'User matches' })
    }

    console.log('Got this far')
    try {
      const action = {
        account: actingActor,
        name: 'updchallenge',
        authorization: [{ actor: actingActor, permission: 'active' }],
        data: { user, challenge_id: challengeId }
      }

      const result = await contractSession.transact({ actions: [action] })
      reply.send({ success: true, transactionId: result.transaction.id })
    } catch (error) {
      reply.code(500).send({ error: error.message })
    }
  }
})

fastify.post('/useEntry', {
  preHandler: verifySession,
  handler: async (request, reply) => {
    console.log(request.body)
    const { user, entryAmount } = request.body

    if (request.user !== user) {
      reply.code(403).send({ error: 'Unauthorized' })
      return
    }
    
    if (!user || !entryAmount) {
      reply.code(400).send({ error: 'Invalid input' })
      return
    }

    try {
      const action = {
        account: actingActor,
        name: 'useentry',
        authorization: [{ actor: actingActor, permission: 'active' }],
        data: { user, entry_amount: entryAmount }
      }

      const result = await contractSession.transact({ actions: [action] })
      reply.send({ success: true, transactionId: result.transaction.id })
    } catch (error) {
      reply.code(500).send({ error: error.message })
    }
  }
})

fastify.post('/transfer', {
  preHandler: verifySession,
  handler: async (request, reply) => {
    const { user } = request.body
    
    if (request.user !== user) {
      reply.code(403).send({ error: 'Unauthorized' })
      return
    }

    try {
      await verifyGameCompletion(user)

      const action = {
        account: actingActor,
        name: 'transfer',
        authorization: [{ actor: actingActor, permission: 'active' }],
        data: { user }
      }

      const result = await contractSession.transact({ actions: [action] })
      reply.send({ success: true, transactionId: result.transaction.id })
    } catch (error) {
      reply.code(403).send({ error: error.message })
    }
  }
})

const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3001, 
      host: '0.0.0.0' 
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() 
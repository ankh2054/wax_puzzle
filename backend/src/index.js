require('dotenv/config')
const Fastify = require('fastify')
const cors = require('@fastify/cors')
const { Session } = require('@wharfkit/session')
const { WalletPluginPrivateKey } = require('@wharfkit/wallet-plugin-privatekey')
const { SigningRequest } = require('@wharfkit/signing-request')
const { PermissionLevel, Signature } = require('@wharfkit/session')

const fastify = Fastify({ logger: true })
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
})

const httpurl = process.env.CHAIN_URL || 'https://hyperion-test.sentnl.io'
console.log(httpurl)
const actingActor = process.env.ACTOR || 'sentnlagents'
const privateKey = process.env.CONTRACT_PRIVATE_KEY 
if (!privateKey) {
  throw new Error('CONTRACT_PRIVATE_KEY environment variable is required')
}



const args = {
  chain: {
    id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    url: httpurl || 'https://hyperion-test.sentnl.io'
  },
  actor: actingActor,
  permission: 'active',
  walletPlugin: new WalletPluginPrivateKey(privateKey),
}

const contractSession = new Session(args)

const verifySession = async (request, reply) => {
  const authHeader = request.headers.authorization
  if (!authHeader) {
    reply.code(401).send({ error: 'No authorization header' })
    return
  }

  try {
    const [, token] = authHeader.split(' ')
    const [encodedRequest, signatureString] = token.split(':')
    
    const request = await SigningRequest.from(encodedRequest)
    const signature = Signature.from(signatureString)
    
    const resolved = await request.resolve()
    
    const isValid = signature.verify(resolved.transaction.signingDigest, resolved.signer.actor)
    
    if (!isValid) {
      throw new Error('Invalid signature')
    }

    const permission = PermissionLevel.from(resolved.signer)
    request.user = permission.actor.toString()

  } catch (error) {
    reply.code(401).send({ error: 'Invalid session' })
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
        scope: 'sentnlagents',
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
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() 
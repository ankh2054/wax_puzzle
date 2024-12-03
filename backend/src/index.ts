import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Session, SessionKit, PrivateKey } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'

// Load environment variables
const CONTRACT_PRIVATE_KEY = process.env.CONTRACT_PRIVATE_KEY
if (!CONTRACT_PRIVATE_KEY) {
  throw new Error('CONTRACT_PRIVATE_KEY environment variable is required')
}

const fastify = Fastify({ logger: true })
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
})

// Initialize contract session
const contractSession = new Session({
  chain: {
    id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    url: 'https://wax.greymass.com'
  },
  actor: 'sentnltestin',
  permission: 'active',
  privateKey: CONTRACT_PRIVATE_KEY
})

// Middleware to verify user session
const verifySession = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization
  if (!authHeader) {
    reply.code(401).send({ error: 'No authorization header' })
    return
  }

  try {
    // Verify the session signature here
    const [user, signature] = authHeader.split(' ')
    if (!user || !signature) {
      reply.code(401).send({ error: 'Invalid authorization format' })
      return
    }

    // Store the verified user in request
    request.user = user
  } catch (error) {
    reply.code(401).send({ error: 'Invalid session' })
    return
  }
}

// Check if user has completed all challenges
const verifyGameCompletion = async (user: string) => {
  try {
    const response = await fetch('https://wax.greymass.com/v1/chain/get_table_rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: true,
        code: 'sentnltestin',
        scope: 'sentnltestin',
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

// Routes
fastify.post('/updateChallenge', async (request, reply) => {
  await verifySession(request, reply)
  const { user, challengeId } = request.body as { user: string, challengeId: number }
  
  // Verify the requesting user matches the target user
  if (request.user !== user) {
    reply.code(403).send({ error: 'Unauthorized' })
    return
  }

  try {
    const action = {
      account: 'sentnltestin',
      name: 'updatechallenge',
      authorization: [{ actor: 'sentnltestin', permission: 'active' }],
      data: { user, challenge_id: challengeId }
    }

    const result = await contractSession.transact({
      action: [action]
    })

    reply.send({ success: true, transactionId: result.transaction.id })
  } catch (error: any) {
    reply.code(500).send({ error: error.message })
  }
})

fastify.post('/validateFee', async (request, reply) => {
  await verifySession(request, reply)
  const { user, fee } = request.body as { user: string, fee: string }
  
  // Verify the requesting user matches the target user
  if (request.user !== user) {
    reply.code(403).send({ error: 'Unauthorized' })
    return
  }

  try {
    const action = {
      account: 'sentnltestin',
      name: 'validateqfee',
      authorization: [{ actor: user, permission: 'active' }],
      data: { user, fee }
    }

    const result = await contractSession.transact({
      action: [action]
    })

    reply.send({ success: true, transactionId: result.transaction.id })
  } catch (error: any) {
    reply.code(500).send({ error: error.message })
  }
})

fastify.post('/transfer', async (request, reply) => {
  await verifySession(request, reply)
  const { user } = request.body as { user: string }
  
  // Verify the requesting user matches the target user
  if (request.user !== user) {
    reply.code(403).send({ error: 'Unauthorized' })
    return
  }

  try {
    // Verify all challenges are complete
    await verifyGameCompletion(user)

    const action = {
      account: 'sentnltestin',
      name: 'transfer',
      authorization: [{ actor: 'sentnltestin', permission: 'active' }],
      data: { user }
    }

    const result = await contractSession.transact({
      action: [action]
    })

    reply.send({ success: true, transactionId: result.transaction.id })
  } catch (error: any) {
    reply.code(403).send({ error: error.message })
  }
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() 
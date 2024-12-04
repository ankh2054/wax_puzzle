import { useState, useEffect } from 'react'
import { SessionKit, Session } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'

const webRenderer = new WebRenderer()

const sessionKit = new SessionKit({
  appName: 'WAX Puzzle Game',
  chains: [{
    id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    url: 'https://testnet.waxsweden.org'
  }],
  walletPlugins: [new WalletPluginAnchor()],
  ui: webRenderer
})

interface WaxLoginProps {
  onSessionUpdate: (session: Session | null) => void
}

export default function WaxLogin({ onSessionUpdate }: WaxLoginProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    webRenderer.appendDialogElement()
    sessionKit.restore()
      .then(restoredSession => {
        if (restoredSession) {
          setSession(restoredSession)
          onSessionUpdate(restoredSession)
        }
      })
      .catch(err => console.error('Session restore failed:', err))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async () => {
    try {
      const { session: newSession } = await sessionKit.login()
      setSession(newSession)
      onSessionUpdate(newSession)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      setError(errorMessage)
      onSessionUpdate(null)
    }
  }

  const logout = async () => {
    await sessionKit.logout()
    setSession(null)
    onSessionUpdate(null)
  }

  return (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          {!session ? (
            <button onClick={login}>Login with WAX</button>
          ) : (
            <div>
              <p className="mb-2">Logged in as: {session.actor.toString()}</p>
              <button onClick={logout}>Logout</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
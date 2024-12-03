import { useState } from 'react'
import { SessionKit } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'

const sessionKit = new SessionKit({
  appName: 'WAX Puzzle Game',
  chains: [{
    id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    url: 'https://wax.greymass.com'
  }],
  walletPlugins: [new WalletPluginAnchor()],
  renderer: new WebRenderer()
})

interface WaxLoginProps {
  onSessionUpdate: (session: any) => void
}

export default function WaxLogin({ onSessionUpdate }: WaxLoginProps) {
  const [session, setSession] = useState(null)

  const login = async () => {
    try {
      const response = await sessionKit.login()
      setSession(response.session)
      onSessionUpdate(response.session)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const logout = async () => {
    setSession(null)
    onSessionUpdate(null)
  }

  return (
    <div className="p-4">
      {!session ? (
        <button
          onClick={login}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login with WAX
        </button>
      ) : (
        <div>
          <p className="mb-2">Logged in as: {session.actor}</p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
} 
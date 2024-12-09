'use client'

import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'
import { SessionKit, Session } from '@wharfkit/session'
import { WebRenderer } from '@wharfkit/web-renderer'
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor'
import { WalletPluginWombat } from '@wharfkit/wallet-plugin-wombat'
import { WalletPluginCloudWallet } from '@wharfkit/wallet-plugin-cloudwallet'

const webRenderer = new WebRenderer()
const sessionKit = new SessionKit({
  appName: 'Cipher Quest',
  chains: [{
    id: process.env.NEXT_PUBLIC_WAX_CHAIN_ID!,
    url: process.env.NEXT_PUBLIC_WAX_RPC_URL!
  }],
  walletPlugins: [
    new WalletPluginCloudWallet({
      supportedChains: [
        process.env.NEXT_PUBLIC_WAX_CHAIN_ID!, // WAX Chain ID
      ],
      url: 'https://www.mycloudwallet.com',
      autoUrl: 'https://idm-api.mycloudwallet.com/v1/accounts/auto-accept',
      loginTimeout: 300000, // 5 minutes
    }),
    new WalletPluginWombat(),
    new WalletPluginAnchor()
  ],
  ui: webRenderer
})

interface WaxLoginProps {
  onSessionUpdate: (session: Session | null) => void
  session: Session | null
}

export default function WaxLogin({ onSessionUpdate, session }: WaxLoginProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [entries, setEntries] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      if (!session) return
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WAX_RPC_URL}/v1/chain/get_table_rows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: true,
            code: process.env.NEXT_PUBLIC_WAX_CONTRACT_ACCOUNT,
            scope: process.env.NEXT_PUBLIC_WAX_CONTRACT_ACCOUNT,
            table: 'games',
            lower_bound: session.actor.toString(),
            upper_bound: session.actor.toString(),
            limit: 1
          })
        })

        const data = await response.json()
        if (data.rows && data.rows.length > 0) {
          setEntries(data.rows[0].game_entries)
        }
      } catch (error) {
        console.error('Error fetching entries:', error)
      }
    }

    fetchEntries()
  }, [session]) // Re-fetch when session changes

  const handleLogin = async (walletType: string) => {
    try {
      let walletPlugin
      switch (walletType) {
        case 'WCW':
          walletPlugin = sessionKit.walletPlugins.find(plugin => plugin.id === 'cloudwallet')
          break
        case 'WOMBAT':
          if (typeof window !== 'undefined' && !window.hasOwnProperty('wombat')) {
            setError('Please install Wombat wallet extension first')
            window.open('https://chrome.google.com/webstore/detail/wombat-wax-wallet/amkmjjmmflddogmhpjloimipbofnfjih', '_blank')
            return
          }
          walletPlugin = sessionKit.walletPlugins.find(plugin => plugin.id === 'wombat')
          break
        case 'ANCHOR':
          walletPlugin = sessionKit.walletPlugins.find(plugin => plugin.id === 'anchor')
          break
        default:
          throw new Error('Unknown wallet type')
      }

      if (!walletPlugin) {
        throw new Error(`Wallet plugin ${walletType} not found`)
      }

      const { session } = await sessionKit.login({
        walletPlugin,
        chain: sessionKit.chains[0],
      })
      
      onSessionUpdate(session)
      setIsModalOpen(false)
      setError(null)
    } catch (e) {
      console.error('Login failed:', e)
      setError('Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await sessionKit.logout()
      onSessionUpdate(null)
      setError(null)
      setEntries(0)
    } catch (e) {
      console.error('Logout failed:', e)
      setError('Logout failed')
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-500 mb-2">{error}</p>}
      
      {!session ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-[#ff6b00] hover:text-[#ff8533] transition-colors"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          Login
        </button>
      ) : (
        <div className="space-y-2">
          <p 
            className="text-[#ff6b00]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            {session.actor.toString()}
          </p>
          <p 
            className="text-[#ff6b00]"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            Entries: {entries}
          </p>
          <button 
            onClick={handleLogout}
            className="text-[#ff6b00] hover:text-[#ff8533] transition-colors"
            style={{ fontFamily: '"Press Start 2P", cursive' }}
          >
            Logout
          </button>
        </div>
      )}

      <LoginModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  )
}
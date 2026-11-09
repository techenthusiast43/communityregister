import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';
import { botchainTestnet, botchainMainnet } from './chains';

// Default project ID (user can supply custom via VITE_WALLETCONNECT_PROJECT_ID)
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'c303f8d676834d8d17b5f13470a7bdf2';

export const networks = [botchainTestnet, botchainMainnet] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [botchainTestnet, botchainMainnet],
  transports: {
    [botchainTestnet.id]: http('https://rpc.bohr.life'),
    [botchainMainnet.id]: http('https://rpc.botchain.ai'),
  },
});

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet, botchainMainnet],
  projectId,
  defaultNetwork: botchainTestnet,
  metadata: {
    name: 'CommunityRegister',
    description: 'BOT Chain Decentralized Membership Register',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://communityregister.botchain.ai',
    icons: ['https://scan.botchain.ai/favicon.ico'],
  },
  themeMode: 'dark',
  features: {
    analytics: false,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;


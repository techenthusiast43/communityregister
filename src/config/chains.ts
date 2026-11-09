import { defineChain } from 'viem';

export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: readonly [string] };
    public: { http: readonly [string] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
  testnet: boolean;
  totalSupply: string;
  faucetUrl?: string;
}

export const botchainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    name: 'BOT Token',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
    public: { http: ['https://rpc.bohr.life'] },
  },
  blockExplorers: {
    default: {
      name: 'BOT Chain Testnet Explorer',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
}) as ChainConfig;

export const botchainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    name: 'BOT Token',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.botchain.ai'] },
    public: { http: ['https://rpc.botchain.ai'] },
  },
  blockExplorers: {
    default: {
      name: 'BOT Chain Explorer',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
}) as ChainConfig;

export const SUPPORTED_CHAINS = [botchainTestnet, botchainMainnet] as const;

export const CHAIN_INFO: Record<number, {
  name: string;
  rpc: string;
  explorer: string;
  symbol: string;
  totalSupply: string;
  isTestnet: boolean;
  faucet?: string;
}> = {
  968: {
    name: 'BOT Chain Testnet',
    rpc: 'https://rpc.bohr.life',
    explorer: 'https://scan.bohr.life',
    symbol: 'BOT',
    totalSupply: '150 Million',
    isTestnet: true,
    faucet: 'https://faucet.botchain.ai/basic',
  },
  677: {
    name: 'BOT Chain Mainnet',
    rpc: 'https://rpc.botchain.ai',
    explorer: 'https://scan.botchain.ai',
    symbol: 'BOT',
    totalSupply: '150 Million',
    isTestnet: false,
  },
};

export const getExplorerAddressUrl = (chainId: number, address: string) => {
  const explorer = CHAIN_INFO[chainId]?.explorer || 'https://scan.bohr.life';
  return `${explorer}/address/${address}`;
};

export const getExplorerTxUrl = (chainId: number, txHash: string) => {
  const explorer = CHAIN_INFO[chainId]?.explorer || 'https://scan.bohr.life';
  return `${explorer}/tx/${txHash}`;
};


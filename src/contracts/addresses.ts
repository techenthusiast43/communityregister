import deployedJson from './deployedAddresses.json';

const deployedMap = deployedJson as Record<string, { contractAddress?: string }>;

// Known deployed addresses per chain
// Reads from deployedAddresses.json first, falls back to environment variables
export const CONTRACT_ADDRESSES: Record<number, string> = {
  // Testnet chainId: 968
  968: deployedMap['968']?.contractAddress || import.meta.env.VITE_COMMUNITY_REGISTER_ADDRESS_TESTNET || '',
  // Mainnet chainId: 677
  677: deployedMap['677']?.contractAddress || import.meta.env.VITE_COMMUNITY_REGISTER_ADDRESS_MAINNET || '',
};

export const getContractAddress = (chainId?: number): string => {
  if (!chainId) return '';
  return CONTRACT_ADDRESSES[chainId] || '';
};

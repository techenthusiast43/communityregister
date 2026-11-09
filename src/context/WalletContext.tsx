import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { CHAIN_INFO, botchainTestnet, botchainMainnet } from '../config/chains';
import { getRpcProvider } from '../contracts/contractService';

interface WalletContextType {
  account?: string;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  isBOTChain: boolean;
  contractAddress: string;
  setContractAddress: (addr: string) => void;
  ethersProvider: ethers.Provider;
  getSigner: () => Promise<ethers.Signer | null>;
  switchChain: (targetChainId: number) => Promise<void>;
  openConnectModal: () => void;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const currentChainId = wagmiChainId || 968;
  const isBOTChain = currentChainId === 968 || currentChainId === 677;

  // Local storage for custom or deployed contract addresses per chain
  const [customAddresses, setCustomAddresses] = useState<Record<number, string>>(() => {
    try {
      const stored = localStorage.getItem('botchain_community_contracts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const contractAddress = useMemo(() => {
    return customAddresses[currentChainId] || CONTRACT_ADDRESSES[currentChainId] || '';
  }, [customAddresses, currentChainId]);

  const handleSetContractAddress = (newAddr: string) => {
    const updated = { ...customAddresses, [currentChainId]: newAddr };
    setCustomAddresses(updated);
    try {
      localStorage.setItem('botchain_community_contracts', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  // Ethers read-only or browser provider
  const ethersProvider = useMemo(() => {
    if (typeof window !== 'undefined' && window.ethereum && isConnected) {
      return new ethers.BrowserProvider(window.ethereum as any);
    }
    return getRpcProvider(currentChainId);
  }, [currentChainId, isConnected]);

  const getSigner = async (): Promise<ethers.Signer | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
      return await browserProvider.getSigner();
    } catch (err) {
      console.error('Failed to get signer:', err);
      return null;
    }
  };

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: targetChainId });
      } else if (typeof window !== 'undefined' && window.ethereum) {
        const hexChainId = `0x${targetChainId.toString(16)}`;
        try {
          await (window.ethereum as any).request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
        } catch (switchError: any) {
          // If chain not added to wallet, add it
          if (switchError.code === 4902) {
            const chainMeta = targetChainId === 968 ? botchainTestnet : botchainMainnet;
            await (window.ethereum as any).request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hexChainId,
                  chainName: chainMeta.name,
                  nativeCurrency: chainMeta.nativeCurrency,
                  rpcUrls: chainMeta.rpcUrls.default.http,
                  blockExplorerUrls: [chainMeta.blockExplorers.default.url],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (err) {
      console.error('Failed to switch network:', err);
      throw err;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account: address,
        chainId: currentChainId,
        isConnected,
        isConnecting,
        isBOTChain,
        contractAddress,
        setContractAddress: handleSetContractAddress,
        ethersProvider,
        getSigner,
        switchChain: handleSwitchChain,
        openConnectModal: () => open(),
        disconnectWallet: () => disconnect(),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};


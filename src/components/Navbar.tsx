import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  UserCheck, 
  Layers, 
  ChevronDown, 
  Globe, 
  Settings, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { CHAIN_INFO } from '../config/chains';
import { ContractSettingsModal } from './ContractSettingsModal';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const { 
    account, 
    chainId, 
    isConnected, 
    isBOTChain, 
    contractAddress, 
    switchChain, 
    openConnectModal 
  } = useWallet();

  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentChain = CHAIN_INFO[chainId] || {
    name: 'Unknown Network',
    symbol: 'BOT',
    isTestnet: false,
  };

  const navItems = [
    { id: 'dashboard', label: 'Explore', icon: Users },
    { id: 'create', label: 'Create Community', icon: PlusCircle },
    { id: 'my-communities', label: 'My Communities', icon: Layers },
    { id: 'verify', label: 'Verify Member', icon: UserCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  CommunityRegister
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  BOT Chain
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Decentralized On-Chain Membership
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Contract Status / Config Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Contract Settings"
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-mono ${
                contractAddress
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              {contractAddress ? (
                <span className="hidden xl:inline text-[11px]">
                  {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </span>
              ) : (
                <span className="hidden sm:inline text-[11px] font-sans font-semibold">
                  Set Contract
                </span>
              )}
            </button>

            {/* Network Selector */}
            <div className="relative">
              <button
                onClick={() => setIsChainMenuOpen(!isChainMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isBOTChain
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isBOTChain ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="hidden sm:inline">{currentChain.name}</span>
                <span className="sm:hidden">{chainId}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isChainMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsChainMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Network
                  </div>
                  <button
                    onClick={() => {
                      switchChain(968);
                      setIsChainMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                      chainId === 968
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>BOT Chain Testnet</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">968</span>
                  </button>

                  <button
                    onClick={() => {
                      switchChain(677);
                      setIsChainMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                      chainId === 677
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                      <span>BOT Chain Mainnet</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">677</span>
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Connect Button */}
            {isConnected && account ? (
              <button
                onClick={openConnectModal}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-mono rounded-xl transition-all shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </button>
            ) : (
              <button
                onClick={openConnectModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 px-2 border-t border-slate-800/60 bg-slate-950/90">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Contract Settings Modal */}
      <ContractSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};


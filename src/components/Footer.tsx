import React from 'react';
import { ShieldCheck, ExternalLink, Network, Coins, Database } from 'lucide-react';
import { CHAIN_INFO } from '../config/chains';
import { useWallet } from '../context/WalletContext';

export const Footer: React.FC = () => {
  const { chainId } = useWallet();
  const currentChain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Column 1: Network specs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Official BOT Chain Parameters</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1.5 font-mono">
              <p>• Testnet Chain ID: <span className="text-slate-200">968</span> (<a href="https://rpc.bohr.life" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">rpc.bohr.life</a>)</p>
              <p>• Mainnet Chain ID: <span className="text-slate-200">677</span> (<a href="https://rpc.botchain.ai" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">rpc.botchain.ai</a>)</p>
              <p>• Native Token: <span className="text-slate-200">BOT</span> (Total Supply: 150 Million)</p>
            </div>
            <div className="pt-1 flex gap-3 text-xs">
              <a
                href={currentChain.explorer}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
              >
                Explorer ({currentChain.name})
                <ExternalLink className="w-3 h-3" />
              </a>
              {currentChain.faucet && (
                <a
                  href={currentChain.faucet}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 font-medium"
                >
                  Testnet Faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Security & Identity Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Decentralized Identity Notice</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CommunityRegister records cryptographic wallet membership directly on BOT Chain. 
              Wallet membership does <strong className="text-slate-200">not</strong> certify real-world legal identity. 
              No private keys, seed phrases, or sensitive personal data are ever requested or stored.
            </p>
          </div>

          {/* Column 3: On-Chain Architecture */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Smart Contract Integrity</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All community metadata, active memberships, and registration timestamps are queried 
              in real-time directly from verified smart contracts deployed on BOT Chain.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CommunityRegister • Built on BOT Chain</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to {currentChain.name}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};


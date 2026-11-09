import React, { useState } from 'react';
import { X, Check, Database, ExternalLink, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { CHAIN_INFO, getExplorerAddressUrl } from '../config/chains';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { chainId, contractAddress, setContractAddress } = useWallet();
  const [inputAddress, setInputAddress] = useState(contractAddress);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setContractAddress(inputAddress.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setInputAddress('');
    setContractAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Smart Contract Settings</h3>
            <p className="text-xs text-slate-400">
              Active Network: <span className="text-emerald-400 font-semibold">{chain.name} (Chain ID {chainId})</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              CommunityRegister Contract Address
            </label>
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="mt-2 text-xs text-slate-400">
              Enter your deployed CommunityRegister contract address on {chain.name}.
            </p>
          </div>

          {contractAddress && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">View on Explorer:</span>
              <a
                href={getExplorerAddressUrl(chainId, contractAddress)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-mono"
              >
                {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear Address
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  'Save Address'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


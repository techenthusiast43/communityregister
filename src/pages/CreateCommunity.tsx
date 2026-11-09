import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  Wallet, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { getSignerContract, parseContractError } from '../contracts/contractService';
import { getExplorerTxUrl, CHAIN_INFO } from '../config/chains';

interface Props {
  onSuccessNavigate: (newCommunityId: string) => void;
}

export const CreateCommunity: React.FC<Props> = ({ onSuccessNavigate }) => {
  const { account, chainId, isConnected, contractAddress, getSigner, openConnectModal } = useWallet();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  // Auto-generate community ID when name changes or customSlug changes
  const generateId = (baseString?: string) => {
    const raw = (baseString || name || 'community').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const salt = Math.floor(Math.random() * 9000 + 1000);
    const slug = `${raw}-${salt}`;
    setCustomSlug(slug);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(slug));
    setCommunityId(hash);
  };

  useEffect(() => {
    if (!communityId) {
      generateId('web3-hub');
    }
  }, []);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomSlug(val);
    if (val.trim()) {
      if (val.startsWith('0x') && val.length === 66) {
        setCommunityId(val);
      } else {
        setCommunityId(ethers.keccak256(ethers.toUtf8Bytes(val.trim().toLowerCase())));
      }
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(communityId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);

    if (!isConnected || !account) {
      openConnectModal();
      return;
    }

    if (!contractAddress) {
      setError(`Smart contract address for ${chain.name} is not set. Please deploy or configure the contract address.`);
      return;
    }

    if (!name.trim()) {
      setError('Please provide a community name.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a community description.');
      return;
    }

    if (!communityId || communityId === ethers.ZeroHash) {
      setError('A valid unique community ID is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const signer = await getSigner();
      if (!signer) throw new Error('Could not acquire wallet signer.');

      const contract = getSignerContract(contractAddress, signer);

      // Call createCommunity(bytes32 communityId, string name, string description)
      const tx = await contract.createCommunity(communityId, name.trim(), description.trim());
      setTxHash(tx.hash);

      await tx.wait();
      // Successful creation
    } catch (err: any) {
      console.error('Failed to create community:', err);
      setError(parseContractError(err));
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Registration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Create a Community on BOT Chain
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Register a verifiable on-chain community. Your wallet address will be permanently designated as the creator.
        </p>
      </div>

      {/* Success Modal / State */}
      {txHash && !error && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Community Successfully Registered!</h3>
              <p className="text-xs text-emerald-300">
                Your community is now live on the BOT Chain ledger.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl space-y-2 border border-slate-800 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Community ID:</span>
              <span className="text-emerald-400 truncate max-w-xs">{communityId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Transaction Hash:</span>
              <a
                href={getExplorerTxUrl(chainId, txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 underline"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => onSuccessNavigate(communityId)}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>View Community Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connection Gate */}
      {!isConnected ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Wallet className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            To register a community on BOT Chain, please connect your Web3 wallet. 
            The connected wallet will be set as the community creator.
          </p>
          <button
            onClick={openConnectModal}
            className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet to Continue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
              {/* Community Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Community Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!customSlug || customSlug.startsWith('web3-hub')) {
                      generateId(e.target.value);
                    }
                  }}
                  placeholder="e.g. BOT Chain Builders, Zero-Knowledge Guild"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your community's purpose, guidelines, or activities..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {/* Unique ID Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Unique Community Identifier
                  </label>
                  <button
                    type="button"
                    onClick={() => generateId(name)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1">Friendly Identifier / Slug:</div>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={handleSlugChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>On-Chain bytes32 ID (keccak256):</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg font-mono text-[11px] text-emerald-400 break-all select-all border border-slate-800/60">
                    {communityId}
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Creator Address:</span>
                <span className="font-mono text-slate-300">
                  {account ? `${account.slice(0, 8)}...${account.slice(-6)}` : 'Not Connected'}
                </span>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming on BOT Chain...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Community Creation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Live Preview & Guidance */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Card Preview
              </span>
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {name || 'Your Community Name'}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {communityId ? `${communityId.slice(0, 10)}...${communityId.slice(-6)}` : '0x...'}
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    0 Members
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3">
                  {description || 'Community description will be displayed here for everyone exploring the register.'}
                </p>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Creator: {account ? `${account.slice(0, 6)}...` : 'You'}</span>
                  <span className="text-emerald-400 font-semibold">BOT Chain</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>On-Chain Guarantees</span>
              </div>
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                <li>Each community ID is unique and immutable.</li>
                <li>Only you (the creator) can update community metadata.</li>
                <li>Any user can join and verify membership permissionlessly.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


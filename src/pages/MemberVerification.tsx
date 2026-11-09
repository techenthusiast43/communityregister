import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { verifyMemberOnChain } from '../contracts/contractService';
import { VerificationResult } from '../types';
import { getExplorerAddressUrl, CHAIN_INFO } from '../config/chains';

interface Props {
  onOpenCommunityDetails?: (communityId: string) => void;
}

export const MemberVerification: React.FC<Props> = ({ onOpenCommunityDetails }) => {
  const { account, chainId, contractAddress } = useWallet();

  const [communityIdInput, setCommunityIdInput] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  const handleUseMyWallet = () => {
    if (account) {
      setWalletInput(account);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityIdInput.trim() || !walletInput.trim()) return;

    try {
      setLoading(true);
      setResult(null);

      const res = await verifyMemberOnChain(
        contractAddress,
        chainId,
        communityIdInput.trim(),
        walletInput.trim()
      );

      setResult(res);
    } catch (err: any) {
      setResult({
        checked: true,
        communityId: communityIdInput,
        walletAddress: walletInput,
        communityExists: false,
        isMember: false,
        error: err?.message || 'Verification lookup failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <UserCheck className="w-3.5 h-3.5" />
          <span>On-Chain Cryptographic Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Verify Community Membership
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl">
          Instantly verify whether any wallet address is registered as an active member in a BOT Chain community.
        </p>
      </div>

      {/* Verification Query Form */}
      <form onSubmit={handleVerify} className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6 shadow-xl">
        {/* Community ID Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Community Identifier (bytes32 hex or slug) *
          </label>
          <input
            type="text"
            required
            value={communityIdInput}
            onChange={(e) => setCommunityIdInput(e.target.value)}
            placeholder="0x... or community-slug"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Accepts either the full 32-byte hash or the community identifier name.
          </p>
        </div>

        {/* Member Wallet Address Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Wallet Address to Verify *
            </label>
            {account && (
              <button
                type="button"
                onClick={handleUseMyWallet}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Use My Connected Wallet
              </button>
            )}
          </div>
          <input
            type="text"
            required
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Submit Query */}
        <button
          type="submit"
          disabled={loading || !communityIdInput.trim() || !walletInput.trim()}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying BOT Chain Ledger...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Verify Membership Status</span>
            </>
          )}
        </button>
      </form>

      {/* Verification Result Card */}
      {result && (
        <div className="animate-fadeIn space-y-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            {/* Header Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.isMember ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : result.communityExists ? (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {result.isMember
                        ? 'Active Registered Member'
                        : result.communityExists
                        ? 'Not an Active Member'
                        : 'Community Not Found'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified on-chain via {chain.name}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {result.isMember ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    VERIFIED ACTIVE
                  </span>
                ) : result.record && result.record.joinCount > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    FORMER MEMBER (LEFT)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    NOT REGISTERED
                  </span>
                )}
              </div>
            </div>

            {/* Error detail if any */}
            {result.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{result.error}</span>
              </div>
            )}

            {/* Verification Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-400 gap-1">
                <span>Wallet Address:</span>
                <a
                  href={getExplorerAddressUrl(chainId, result.walletAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold"
                >
                  <span className="break-all">{result.walletAddress}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-400 gap-1">
                <span>Community ID:</span>
                <span className="text-slate-200 break-all">{result.communityId}</span>
              </div>

              {result.communityName && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Community Name:</span>
                  <span className="text-white font-bold font-sans">{result.communityName}</span>
                </div>
              )}

              {/* Historical Record Details */}
              {result.record && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>First Joined:</span>
                    <span className="text-slate-200">
                      {result.record.firstJoinedAt > 0
                        ? new Date(result.record.firstJoinedAt * 1000).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>

                  {result.record.lastJoinedAt > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Last Joined At:</span>
                      <span className="text-slate-200">
                        {new Date(result.record.lastJoinedAt * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {result.record.leftAt > 0 && !result.isMember && (
                    <div className="flex justify-between items-center">
                      <span>Left Community At:</span>
                      <span className="text-amber-400">
                        {new Date(result.record.leftAt * 1000).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Lifetime Join Count:</span>
                    <span className="text-slate-200">{result.record.joinCount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Link to Community */}
            {result.communityExists && onOpenCommunityDetails && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => onOpenCommunityDetails(result.communityId)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Community Hub</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust Notice */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verification Notice</span>
        </div>
        <p className="leading-relaxed">
          Active membership status is read directly from the BOT Chain smart contract via RPC queries.
          This confirms the wallet address signed an on-chain registration transaction and is currently recorded in the active member registry.
        </p>
      </div>
    </div>
  );
};


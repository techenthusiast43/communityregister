import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  ArrowRight, 
  Check, 
  Copy, 
  ExternalLink, 
  UserPlus, 
  UserMinus, 
  Loader2 
} from 'lucide-react';
import { Community } from '../types';
import { useWallet } from '../context/WalletContext';
import { getExplorerAddressUrl } from '../config/chains';
import { getSignerContract, parseContractError } from '../contracts/contractService';

interface Props {
  community: Community;
  isMember?: boolean;
  onOpenDetails: (communityId: string) => void;
  onActionSuccess?: () => void;
}

export const CommunityCard: React.FC<Props> = ({
  community,
  isMember = false,
  onOpenDetails,
  onActionSuccess,
}) => {
  const { account, chainId, contractAddress, getSigner, isConnected, openConnectModal } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCreator = account && community.creator.toLowerCase() === account.toLowerCase();

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(community.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleMembership = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionError(null);

    if (!isConnected) {
      openConnectModal();
      return;
    }

    if (!contractAddress) {
      setActionError('Smart contract address not configured.');
      return;
    }

    try {
      setIsSubmitting(true);
      const signer = await getSigner();
      if (!signer) throw new Error('Could not get wallet signer.');

      const contract = getSignerContract(contractAddress, signer);

      let tx;
      if (isMember) {
        tx = await contract.leaveCommunity(community.id);
      } else {
        tx = await contract.joinCommunity(community.id);
      }

      await tx.wait();
      if (onActionSuccess) onActionSuccess();
    } catch (err: any) {
      console.error('Membership action failed:', err);
      setActionError(parseContractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(community.createdAt * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div 
      onClick={() => onOpenDetails(community.id)}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900 transition-all duration-300 shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                {community.name}
              </h3>
              {isCreator && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-3 h-3" />
                  Creator
                </span>
              )}
            </div>

            {/* Community ID Badge */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                {community.id.slice(0, 10)}...{community.id.slice(-6)}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Full ID"
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Member Count Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>{community.activeMemberCount}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {community.description}
        </p>
      </div>

      {/* Footer Info & Quick Actions */}
      <div className="pt-4 border-t border-slate-800/60 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <span>Created:</span>
            <span className="text-slate-300">{formattedDate}</span>
          </div>

          <a
            href={getExplorerAddressUrl(chainId, community.creator)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-mono transition-colors"
          >
            <span>by {community.creator.slice(0, 5)}...{community.creator.slice(-4)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {actionError && (
          <p className="text-[11px] text-red-400 mb-2 truncate" title={actionError}>
            {actionError}
          </p>
        )}

        <div className="flex items-center gap-2">
          {/* Quick Join/Leave Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleToggleMembership}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              isMember
                ? 'bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700/60'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isMember ? (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>Leave</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Join</span>
              </>
            )}
          </button>

          {/* Details Button */}
          <button
            type="button"
            onClick={() => onOpenDetails(community.id)}
            className="flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-white rounded-xl text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};


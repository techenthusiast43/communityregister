import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  UserPlus, 
  UserMinus, 
  Edit3, 
  Save, 
  X, 
  Loader2, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { Community, MemberRecord } from '../types';
import { useWallet } from '../context/WalletContext';
import { 
  fetchCommunityDetails, 
  getReadOnlyContract, 
  getSignerContract, 
  parseContractError 
} from '../contracts/contractService';
import { getExplorerAddressUrl, getExplorerTxUrl, CHAIN_INFO } from '../config/chains';

interface Props {
  communityId: string;
  onBack: () => void;
}

interface MemberWithRecord {
  address: string;
  record?: MemberRecord;
}

export const CommunityDetails: React.FC<Props> = ({ communityId, onBack }) => {
  const { account, chainId, contractAddress, getSigner, isConnected, openConnectModal } = useWallet();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberWithRecord[]>([]);
  const [isCurrentUserMember, setIsCurrentUserMember] = useState(false);
  const [currentUserRecord, setCurrentUserRecord] = useState<MemberRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit State (for creator only)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  const loadData = async () => {
    if (!contractAddress || !communityId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetchCommunityDetails(contractAddress, chainId, communityId);
      if (!res) {
        setError('Community not found on this BOT Chain contract.');
        setLoading(false);
        return;
      }

      setCommunity(res.community);
      setEditName(res.community.name);
      setEditDesc(res.community.description);

      const contract = getReadOnlyContract(contractAddress, chainId);

      // Fetch member records for timestamps
      const membersWithRecords: MemberWithRecord[] = await Promise.all(
        res.members.map(async (addr) => {
          try {
            const raw = await contract.getMemberRecord(communityId, addr);
            return {
              address: addr,
              record: {
                isActive: raw[0],
                firstJoinedAt: Number(raw[1]),
                lastJoinedAt: Number(raw[2]),
                leftAt: Number(raw[3]),
                joinCount: Number(raw[4]),
              },
            };
          } catch {
            return { address: addr };
          }
        })
      );

      setMembers(membersWithRecords);

      // Check current user status
      if (account) {
        const isMem: boolean = await contract.isMember(communityId, account);
        setIsCurrentUserMember(isMem);

        try {
          const raw = await contract.getMemberRecord(communityId, account);
          setCurrentUserRecord({
            isActive: raw[0],
            firstJoinedAt: Number(raw[1]),
            lastJoinedAt: Number(raw[2]),
            leftAt: Number(raw[3]),
            joinCount: Number(raw[4]),
          });
        } catch {
          setCurrentUserRecord(null);
        }
      }
    } catch (err: any) {
      console.error('Error loading community details:', err);
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [communityId, contractAddress, chainId, account]);

  const isCreator = Boolean(
    account && community && community.creator.toLowerCase() === account.toLowerCase()
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(communityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleToggleMembership = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }

    if (!contractAddress) {
      setError('Smart contract address is not configured.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const signer = await getSigner();
      if (!signer) throw new Error('Could not acquire wallet signer.');

      const contract = getSignerContract(contractAddress, signer);

      let tx;
      if (isCurrentUserMember) {
        tx = await contract.leaveCommunity(communityId);
      } else {
        tx = await contract.joinCommunity(communityId);
      }

      await tx.wait();
      await loadData();
    } catch (err: any) {
      console.error('Membership toggle error:', err);
      setError(parseContractError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractAddress || !isCreator) return;

    try {
      setEditLoading(true);
      setError(null);
      const signer = await getSigner();
      if (!signer) throw new Error('Could not acquire wallet signer.');

      const contract = getSignerContract(contractAddress, signer);
      const tx = await contract.updateCommunity(communityId, editName.trim(), editDesc.trim());
      await tx.wait();

      setIsEditing(false);
      await loadData();
    } catch (err: any) {
      console.error('Update community error:', err);
      setError(parseContractError(err));
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">Loading community records from BOT Chain...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Community Not Found</h2>
        <p className="text-xs text-slate-400">
          {error || `Unable to load community with ID ${communityId}. Verify your network and contract settings.`}
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Communities</span>
        </button>
      </div>

      {/* Main Community Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {community.name}
              </h1>
              {isCreator && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  Creator
                </span>
              )}
              {isCurrentUserMember && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active Member
                </span>
              )}
            </div>

            {/* ID & Copy */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-slate-400">ID:</span>
              <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-emerald-400 break-all select-all">
                {community.id}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title="Copy ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Description or Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Edit Community Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Edit Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-1">
                {community.description}
              </p>
            )}
          </div>

          {/* Action Column */}
          <div className="flex flex-col items-start sm:items-end gap-4 shrink-0">
            {/* Member Count Box */}
            <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {community.activeMemberCount}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                <Users className="w-3.5 h-3.5" />
                <span>Active Registered Members</span>
              </div>
            </div>

            {/* Join / Leave Button */}
            <div className="w-full sm:w-auto">
              <button
                onClick={handleToggleMembership}
                disabled={actionLoading}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isCurrentUserMember
                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 shadow-red-500/10'
                    : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing on BOT Chain...</span>
                  </>
                ) : isCurrentUserMember ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Leave Community</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Join Community</span>
                  </>
                )}
              </button>
            </div>

            {/* Creator Edit Trigger */}
            {isCreator && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Update Community Details</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Community Meta Info Bar */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <span className="block text-slate-500 mb-0.5">Creator Wallet</span>
            <a
              href={getExplorerAddressUrl(chainId, community.creator)}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-mono inline-flex items-center gap-1"
            >
              <span>{community.creator.slice(0, 8)}...{community.creator.slice(-6)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <span className="block text-slate-500 mb-0.5">Registration Timestamp</span>
            <span className="text-slate-300 font-mono">
              {new Date(community.createdAt * 1000).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="block text-slate-500 mb-0.5">Network Verification</span>
            <span className="text-slate-300">
              Verified on {chain.name}
            </span>
          </div>
        </div>
      </div>

      {/* Member History for Connected User (if applicable) */}
      {currentUserRecord && currentUserRecord.joinCount > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Your Membership Record</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-300 font-mono text-[11px] pt-1">
            <div>
              <span className="text-slate-500 block">Status:</span>
              <span className={currentUserRecord.isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {currentUserRecord.isActive ? 'Active Member' : 'Formerly Joined'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">First Joined:</span>
              <span>{new Date(currentUserRecord.firstJoinedAt * 1000).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Last Activity:</span>
              <span>
                {new Date((currentUserRecord.lastJoinedAt || currentUserRecord.leftAt) * 1000).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Joins:</span>
              <span>{currentUserRecord.joinCount} time(s)</span>
            </div>
          </div>
        </div>
      )}

      {/* Registered Members Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Registered Members</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {members.length}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographic member list recorded on BOT Chain
          </p>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">No Registered Members Yet</p>
            <p className="text-xs text-slate-400">Be the first to join this community!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Member Wallet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((member, idx) => {
                  const isYou = account && member.address.toLowerCase() === account.toLowerCase();
                  const registeredDate = member.record?.firstJoinedAt
                    ? new Date(member.record.firstJoinedAt * 1000).toLocaleString()
                    : 'On-Chain';

                  return (
                    <tr
                      key={member.address}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isYou ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200">
                            {member.address}
                          </span>
                          {isYou && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active Member
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {registeredDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={getExplorerAddressUrl(chainId, member.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono hover:underline"
                        >
                          <span>Scan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


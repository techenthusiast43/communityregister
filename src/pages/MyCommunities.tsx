import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Crown, 
  UserCheck, 
  Wallet, 
  PlusCircle, 
  RefreshCw, 
  Loader2, 
  Users, 
  ArrowRight 
} from 'lucide-react';
import { Community } from '../types';
import { useWallet } from '../context/WalletContext';
import { getReadOnlyContract } from '../contracts/contractService';
import { CommunityCard } from '../components/CommunityCard';

interface Props {
  onOpenDetails: (communityId: string) => void;
  onNavigateCreate: () => void;
}

export const MyCommunities: React.FC<Props> = ({ onOpenDetails, onNavigateCreate }) => {
  const { account, chainId, contractAddress, isConnected, openConnectModal } = useWallet();
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');

  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    if (!contractAddress || !account) {
      setCreatedCommunities([]);
      setJoinedCommunities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contract = getReadOnlyContract(contractAddress, chainId);

      // 1. Fetch communities created by current user
      const createdIds: string[] = await contract.getCommunitiesByCreator(account);
      const createdList: Community[] = [];
      for (const id of createdIds) {
        try {
          const comm = await contract.getCommunity(id);
          createdList.push({
            id: comm[0],
            name: comm[1],
            description: comm[2],
            creator: comm[3],
            createdAt: Number(comm[4]),
            activeMemberCount: Number(comm[5]),
          });
        } catch (e) {
          console.warn(`Error loading created community ${id}:`, e);
        }
      }
      setCreatedCommunities(createdList);

      // 2. Fetch communities user joined
      const joinedIds: string[] = await contract.getUserJoinedCommunities(account);
      const joinedList: Community[] = [];
      for (const id of joinedIds) {
        try {
          const isMem = await contract.isMember(id, account);
          if (isMem) {
            const comm = await contract.getCommunity(id);
            joinedList.push({
              id: comm[0],
              name: comm[1],
              description: comm[2],
              creator: comm[3],
              createdAt: Number(comm[4]),
              activeMemberCount: Number(comm[5]),
            });
          }
        } catch (e) {
          console.warn(`Error loading joined community ${id}:`, e);
        }
      }
      setJoinedCommunities(joinedList);
    } catch (err) {
      console.error('Error fetching user communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [account, contractAddress, chainId]);

  if (!isConnected || !account) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Connect your Web3 wallet to manage the communities you created or see all the BOT Chain communities you have joined.
        </p>
        <button
          onClick={openConnectModal}
          className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  const currentList = activeTab === 'created' ? createdCommunities : joinedCommunities;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Personal Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Communities
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Wallet: <span className="font-mono text-emerald-400">{account}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUserData}
            title="Refresh"
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={onNavigateCreate}
            className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'created'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Created by Me ({createdCommunities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('joined')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
            activeTab === 'joined'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Communities I Joined ({joinedCommunities.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {currentList.map((comm) => (
            <CommunityCard
              key={comm.id}
              community={comm}
              isMember={true}
              onOpenDetails={onOpenDetails}
              onActionSuccess={loadUserData}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
            {activeTab === 'created' ? <Crown className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-white">
            {activeTab === 'created'
              ? 'You have not created any communities yet'
              : 'You have not joined any communities yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'created'
              ? 'Launch your decentralized community on BOT Chain in just a few clicks.'
              : 'Browse communities on the dashboard and join active groups with one click.'}
          </p>
          {activeTab === 'created' && (
            <button
              onClick={onNavigateCreate}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Community</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  Users, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal, 
  Layers, 
  HelpCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { Community } from '../types';
import { useWallet } from '../context/WalletContext';
import { fetchAllCommunities, getReadOnlyContract } from '../contracts/contractService';
import { CommunityCard } from '../components/CommunityCard';
import { CHAIN_INFO } from '../config/chains';

interface Props {
  onOpenDetails: (communityId: string) => void;
  onNavigateCreate: () => void;
  onNavigateVerify: () => void;
}

export const HomeDashboard: React.FC<Props> = ({
  onOpenDetails,
  onNavigateCreate,
  onNavigateVerify,
}) => {
  const { chainId, contractAddress, account } = useWallet();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userJoinedSet, setUserJoinedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'joined' | 'created'>('all');

  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];

  const loadData = async () => {
    if (!contractAddress) {
      setCommunities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchAllCommunities(contractAddress, chainId);
      setCommunities(data);

      if (account) {
        try {
          const contract = getReadOnlyContract(contractAddress, chainId);
          const joinedIds: string[] = await contract.getUserJoinedCommunities(account);
          // Check active status
          const activeSet = new Set<string>();
          for (const id of joinedIds) {
            const isMem = await contract.isMember(id, account);
            if (isMem) activeSet.add(id.toLowerCase());
          }
          setUserJoinedSet(activeSet);
        } catch (e) {
          console.warn('Could not load joined statuses:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contractAddress, chainId, account]);

  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === 'joined') {
        return userJoinedSet.has(c.id.toLowerCase());
      }
      if (filterType === 'created' && account) {
        return c.creator.toLowerCase() === account.toLowerCase();
      }

      return true;
    });
  }, [communities, searchQuery, filterType, userJoinedSet, account]);

  const totalMembers = useMemo(() => {
    return communities.reduce((acc, curr) => acc + curr.activeMemberCount, 0);
  }, [communities]);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 border border-slate-800 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Decentralized Membership on BOT Chain</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Create, Join & Verify <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              On-Chain Communities
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-2xl">
            CommunityRegister records verifiable cryptographic membership transparently on BOT Chain. 
            Connect your wallet to create a decentralized community or register as an active member.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onNavigateCreate}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Community</span>
            </button>
            <button
              onClick={onNavigateVerify}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 transition-colors flex items-center gap-2"
            >
              <span>Verify Member</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-800/80">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {communities.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Communities Registered</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {totalMembers}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Active Registrations</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-sm font-bold text-slate-200 truncate">
              {chain.name}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">Chain ID: {chainId}</div>
          </div>
        </div>
      </section>

      {/* Contract Notice if not deployed */}
      {!contractAddress && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-semibold block text-amber-200">Contract Address Not Set for {chain.name}:</strong>
            Deploy the contract to {chain.name} using <code className="px-1.5 py-0.5 bg-slate-950 rounded text-amber-200 font-mono">npm run deploy:testnet</code> (or mainnet), then click "Set Contract" in the navigation bar to paste the deployed address.
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by community name, description, ID or creator..."
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({communities.length})
              </button>
              {account && (
                <>
                  <button
                    onClick={() => setFilterType('joined')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      filterType === 'joined'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Joined ({userJoinedSet.size})
                  </button>
                  <button
                    onClick={() => setFilterType('created')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      filterType === 'created'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Created by Me
                  </button>
                </>
              )}
            </div>

            <button
              onClick={loadData}
              title="Refresh communities"
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={userJoinedSet.has(community.id.toLowerCase())}
                onOpenDetails={onOpenDetails}
                onActionSuccess={loadData}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Communities Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchQuery
                ? `No communities matched "${searchQuery}". Try adjusting your keywords.`
                : 'There are currently no communities registered on this BOT Chain contract.'}
            </p>
            <button
              onClick={onNavigateCreate}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create the First Community</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};


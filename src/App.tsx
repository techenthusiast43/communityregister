import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeDashboard } from './pages/HomeDashboard';
import { CreateCommunity } from './pages/CreateCommunity';
import { CommunityDetails } from './pages/CommunityDetails';
import { MyCommunities } from './pages/MyCommunities';
import { MemberVerification } from './pages/MemberVerification';
import { useWallet } from './context/WalletContext';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const { isConnected, isBOTChain, chainId, switchChain } = useWallet();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const handleOpenDetails = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setCurrentTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboard = () => {
    setSelectedCommunityId(null);
    setCurrentTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCreate = () => {
    setCurrentTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateVerify = () => {
    setCurrentTab('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Wrong Network Banner */}
      {isConnected && !isBOTChain && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 text-amber-300 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              You are connected to an unsupported network (Chain ID: {chainId}). Switch to BOT Chain to interact with the dApp.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchChain(968)}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <span>Switch to Testnet (968)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => switchChain(677)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg transition-colors text-xs"
            >
              Mainnet (677)
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'details') setSelectedCommunityId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentTab === 'dashboard' && (
          <HomeDashboard
            onOpenDetails={handleOpenDetails}
            onNavigateCreate={handleNavigateCreate}
            onNavigateVerify={handleNavigateVerify}
          />
        )}

        {currentTab === 'create' && (
          <CreateCommunity
            onSuccessNavigate={(newId) => handleOpenDetails(newId)}
          />
        )}

        {currentTab === 'details' && selectedCommunityId && (
          <CommunityDetails
            communityId={selectedCommunityId}
            onBack={handleNavigateDashboard}
          />
        )}

        {currentTab === 'my-communities' && (
          <MyCommunities
            onOpenDetails={handleOpenDetails}
            onNavigateCreate={handleNavigateCreate}
          />
        )}

        {currentTab === 'verify' && (
          <MemberVerification
            onOpenCommunityDetails={handleOpenDetails}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};


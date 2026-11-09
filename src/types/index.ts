export interface Community {
  id: string; // 0x... bytes32 hex string
  name: string;
  description: string;
  creator: string;
  createdAt: number; // Unix timestamp in seconds
  activeMemberCount: number;
}

export interface MemberRecord {
  isActive: boolean;
  firstJoinedAt: number;
  lastJoinedAt: number;
  leftAt: number;
  joinCount: number;
}

export interface VerificationResult {
  checked: boolean;
  communityId: string;
  walletAddress: string;
  communityExists: boolean;
  communityName?: string;
  isMember: boolean;
  record?: MemberRecord;
  error?: string;
}

export type TxStatus = 'idle' | 'preparing' | 'submitting' | 'confirmed' | 'error';

export interface TxFeedback {
  status: TxStatus;
  hash?: string;
  message?: string;
  error?: string;
}


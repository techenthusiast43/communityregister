import { ethers } from 'ethers';
import { COMMUNITY_REGISTER_ABI } from './abi';
import { CHAIN_INFO } from '../config/chains';
import { Community, MemberRecord, VerificationResult } from '../types';

/**
 * Creates a JsonRpcProvider for the specified BOT Chain network
 */
export function getRpcProvider(chainId: number): ethers.JsonRpcProvider {
  const chain = CHAIN_INFO[chainId] || CHAIN_INFO[968];
  return new ethers.JsonRpcProvider(chain.rpc);
}

/**
 * Creates a read-only ethers Contract instance
 */
export function getReadOnlyContract(
  contractAddress: string,
  chainId: number = 968
): ethers.Contract {
  const provider = getRpcProvider(chainId);
  return new ethers.Contract(contractAddress, COMMUNITY_REGISTER_ABI, provider);
}

/**
 * Creates an ethers Contract instance connected to a Signer (for write operations)
 */
export function getSignerContract(
  contractAddress: string,
  signer: ethers.Signer
): ethers.Contract {
  return new ethers.Contract(contractAddress, COMMUNITY_REGISTER_ABI, signer);
}

/**
 * Helper to compute bytes32 community ID from a human string or slug
 */
export function formatCommunityId(rawId: string): string {
  const trimmed = rawId.trim();
  if (trimmed.startsWith('0x') && trimmed.length === 66) {
    return trimmed;
  }
  return ethers.keccak256(ethers.toUtf8Bytes(trimmed.toLowerCase()));
}

/**
 * Fetch all communities on-chain
 */
export async function fetchAllCommunities(
  contractAddress: string,
  chainId: number
): Promise<Community[]> {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    return [];
  }

  const contract = getReadOnlyContract(contractAddress, chainId);
  try {
    const ids: string[] = await contract.getAllCommunityIds();
    const communities: Community[] = [];

    for (const id of ids) {
      try {
        const comm = await contract.getCommunity(id);
        communities.push({
          id: comm[0],
          name: comm[1],
          description: comm[2],
          creator: comm[3],
          createdAt: Number(comm[4]),
          activeMemberCount: Number(comm[5]),
        });
      } catch (err) {
        console.warn(`Failed to fetch community with ID ${id}:`, err);
      }
    }

    return communities;
  } catch (error) {
    console.error('Error fetching communities from contract:', error);
    return [];
  }
}

/**
 * Fetch a single community by ID
 */
export async function fetchCommunityDetails(
  contractAddress: string,
  chainId: number,
  communityId: string
): Promise<{
  community: Community;
  members: string[];
} | null> {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    return null;
  }

  const contract = getReadOnlyContract(contractAddress, chainId);
  try {
    const formattedId = formatCommunityId(communityId);
    const comm = await contract.getCommunity(formattedId);
    const members: string[] = await contract.getMembers(formattedId);

    return {
      community: {
        id: comm[0],
        name: comm[1],
        description: comm[2],
        creator: comm[3],
        createdAt: Number(comm[4]),
        activeMemberCount: Number(comm[5]),
      },
      members,
    };
  } catch (error) {
    console.error('Error fetching community details:', error);
    return null;
  }
}

/**
 * Verify member on-chain
 */
export async function verifyMemberOnChain(
  contractAddress: string,
  chainId: number,
  communityId: string,
  walletAddress: string
): Promise<VerificationResult> {
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    return {
      checked: true,
      communityId,
      walletAddress,
      communityExists: false,
      isMember: false,
      error: 'Smart contract address is not configured for this network.',
    };
  }

  if (!ethers.isAddress(walletAddress)) {
    return {
      checked: true,
      communityId,
      walletAddress,
      communityExists: false,
      isMember: false,
      error: 'Invalid wallet address format.',
    };
  }

  const contract = getReadOnlyContract(contractAddress, chainId);
  try {
    const formattedId = formatCommunityId(communityId);

    let communityName = '';
    let exists = false;
    try {
      const comm = await contract.getCommunity(formattedId);
      communityName = comm[1];
      exists = true;
    } catch {
      exists = false;
    }

    if (!exists) {
      return {
        checked: true,
        communityId: formattedId,
        walletAddress,
        communityExists: false,
        isMember: false,
        error: 'Community with this ID does not exist on BOT Chain.',
      };
    }

    const isMem: boolean = await contract.isMember(formattedId, walletAddress);
    const recordRaw = await contract.getMemberRecord(formattedId, walletAddress);

    const record: MemberRecord = {
      isActive: recordRaw[0],
      firstJoinedAt: Number(recordRaw[1]),
      lastJoinedAt: Number(recordRaw[2]),
      leftAt: Number(recordRaw[3]),
      joinCount: Number(recordRaw[4]),
    };

    return {
      checked: true,
      communityId: formattedId,
      walletAddress,
      communityExists: true,
      communityName,
      isMember: isMem,
      record,
    };
  } catch (error: any) {
    return {
      checked: true,
      communityId,
      walletAddress,
      communityExists: false,
      isMember: false,
      error: error?.reason || error?.message || 'Verification failed on-chain.',
    };
  }
}

/**
 * Friendly error parser for ethers / custom contract errors
 */
export function parseContractError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  if (error.reason) return error.reason;
  if (error.shortMessage) return error.shortMessage;
  if (error.data) {
    const dataStr = String(error.data);
    if (dataStr.includes('AlreadyMember') || dataStr.includes('0x6739669e')) {
      return 'This wallet is already an active member of this community.';
    }
    if (dataStr.includes('NotActiveMember') || dataStr.includes('0x407c0ea0')) {
      return 'This wallet is not currently an active member.';
    }
    if (dataStr.includes('CommunityAlreadyExists') || dataStr.includes('0x19ba605d')) {
      return 'A community with this unique ID already exists.';
    }
    if (dataStr.includes('NotCommunityCreator') || dataStr.includes('0xa4e98f02')) {
      return 'Only the original community creator can perform this action.';
    }
    if (dataStr.includes('CommunityDoesNotExist') || dataStr.includes('0xec18359b')) {
      return 'This community does not exist on BOT Chain.';
    }
  }

  const msg = error.message || String(error);
  if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
    return 'Transaction was cancelled by user.';
  }
  if (msg.includes('insufficient funds')) {
    return 'Insufficient BOT tokens to pay for network gas.';
  }
  return msg;
}


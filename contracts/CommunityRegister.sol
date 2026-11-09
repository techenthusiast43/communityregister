// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CommunityRegister
 * @dev Modern decentralized membership registration platform on BOT Chain.
 * Allows creating communities, joining, leaving, verifying membership status,
 * and maintaining transparent on-chain membership history.
 */
contract CommunityRegister {
    struct MemberRecord {
        bool isActive;
        uint256 firstJoinedAt;
        uint256 lastJoinedAt;
        uint256 leftAt;
        uint256 joinCount;
        uint256 memberIndex; // index in activeMembers array for O(1) removal
    }

    struct Community {
        bytes32 id;
        string name;
        string description;
        address creator;
        uint256 createdAt;
        uint256 activeMemberCount;
        bool exists;
    }

    // List of all registered community IDs
    bytes32[] private _communityIds;

    // communityId => Community struct
    mapping(bytes32 => Community) private _communities;

    // communityId => memberAddress => MemberRecord
    mapping(bytes32 => mapping(address => MemberRecord)) private _members;

    // communityId => list of active member addresses
    mapping(bytes32 => address[]) private _activeMembers;

    // userAddress => list of community IDs they have created
    mapping(address => bytes32[]) private _creatorCommunities;

    // userAddress => list of community IDs they have joined (active)
    mapping(address => bytes32[]) private _userJoinedCommunities;

    // Events
    event CommunityCreated(
        bytes32 indexed communityId,
        address indexed creator,
        string name,
        string description,
        uint256 createdAt
    );

    event CommunityUpdated(
        bytes32 indexed communityId,
        string name,
        string description,
        uint256 updatedAt
    );

    event MemberJoined(
        bytes32 indexed communityId,
        address indexed member,
        uint256 joinedAt,
        uint256 newMemberCount
    );

    event MemberLeft(
        bytes32 indexed communityId,
        address indexed member,
        uint256 leftAt,
        uint256 newMemberCount
    );

    // Custom Errors for gas efficiency
    error InvalidCommunityId();
    error EmptyName();
    error EmptyDescription();
    error CommunityAlreadyExists();
    error CommunityDoesNotExist();
    error AlreadyMember();
    error NotActiveMember();
    error NotCommunityCreator();

    modifier onlyExistingCommunity(bytes32 communityId) {
        if (!_communities[communityId].exists) {
            revert CommunityDoesNotExist();
        }
        _;
    }

    /**
     * @notice Create a new community with a unique ID, name, and description.
     * @param communityId Unique identifier for the community.
     * @param name Name of the community.
     * @param description Short description of the community.
     */
    function createCommunity(
        bytes32 communityId,
        string calldata name,
        string calldata description
    ) external {
        if (communityId == bytes32(0)) revert InvalidCommunityId();
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (_communities[communityId].exists) revert CommunityAlreadyExists();

        _communities[communityId] = Community({
            id: communityId,
            name: name,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            activeMemberCount: 0,
            exists: true
        });

        _communityIds.push(communityId);
        _creatorCommunities[msg.sender].push(communityId);

        emit CommunityCreated(
            communityId,
            msg.sender,
            name,
            description,
            block.timestamp
        );
    }

    /**
     * @notice Update details of an existing community. Restricted to the creator.
     * @param communityId Community ID to update.
     * @param name New name.
     * @param description New description.
     */
    function updateCommunity(
        bytes32 communityId,
        string calldata name,
        string calldata description
    ) external onlyExistingCommunity(communityId) {
        Community storage comm = _communities[communityId];
        if (comm.creator != msg.sender) revert NotCommunityCreator();
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(description).length == 0) revert EmptyDescription();

        comm.name = name;
        comm.description = description;

        emit CommunityUpdated(communityId, name, description, block.timestamp);
    }

    /**
     * @notice Join an existing community as a member.
     * @param communityId Community identifier.
     */
    function joinCommunity(bytes32 communityId)
        external
        onlyExistingCommunity(communityId)
    {
        MemberRecord storage record = _members[communityId][msg.sender];
        if (record.isActive) revert AlreadyMember();

        if (record.firstJoinedAt == 0) {
            record.firstJoinedAt = block.timestamp;
            // First time joining, add to user's joined list tracking
            _userJoinedCommunities[msg.sender].push(communityId);
        }

        record.isActive = true;
        record.lastJoinedAt = block.timestamp;
        record.joinCount += 1;
        record.memberIndex = _activeMembers[communityId].length;

        _activeMembers[communityId].push(msg.sender);
        _communities[communityId].activeMemberCount += 1;

        emit MemberJoined(
            communityId,
            msg.sender,
            block.timestamp,
            _communities[communityId].activeMemberCount
        );
    }

    /**
     * @notice Leave a community. Preserves historical membership records.
     * @param communityId Community identifier.
     */
    function leaveCommunity(bytes32 communityId)
        external
        onlyExistingCommunity(communityId)
    {
        MemberRecord storage record = _members[communityId][msg.sender];
        if (!record.isActive) revert NotActiveMember();

        record.isActive = false;
        record.leftAt = block.timestamp;

        // O(1) swap-and-pop from active members array
        address[] storage activeList = _activeMembers[communityId];
        uint256 indexToRemove = record.memberIndex;
        uint256 lastIndex = activeList.length - 1;

        if (indexToRemove != lastIndex) {
            address lastMember = activeList[lastIndex];
            activeList[indexToRemove] = lastMember;
            _members[communityId][lastMember].memberIndex = indexToRemove;
        }
        activeList.pop();

        _communities[communityId].activeMemberCount -= 1;

        emit MemberLeft(
            communityId,
            msg.sender,
            block.timestamp,
            _communities[communityId].activeMemberCount
        );
    }

    /**
     * @notice Get full details of a community.
     * @param communityId Community identifier.
     */
    function getCommunity(bytes32 communityId)
        external
        view
        onlyExistingCommunity(communityId)
        returns (
            bytes32 id,
            string memory name,
            string memory description,
            address creator,
            uint256 createdAt,
            uint256 activeMemberCount
        )
    {
        Community storage comm = _communities[communityId];
        return (
            comm.id,
            comm.name,
            comm.description,
            comm.creator,
            comm.createdAt,
            comm.activeMemberCount
        );
    }

    /**
     * @notice Check whether a given wallet address is currently an active member.
     * @param communityId Community identifier.
     * @param member Wallet address to check.
     */
    function isMember(bytes32 communityId, address member)
        external
        view
        returns (bool)
    {
        return _members[communityId][member].isActive;
    }

    /**
     * @notice Get current active member count for a community.
     * @param communityId Community identifier.
     */
    function getMemberCount(bytes32 communityId)
        external
        view
        onlyExistingCommunity(communityId)
        returns (uint256)
    {
        return _communities[communityId].activeMemberCount;
    }

    /**
     * @notice Get list of all currently active member addresses for a community.
     * @param communityId Community identifier.
     */
    function getMembers(bytes32 communityId)
        external
        view
        onlyExistingCommunity(communityId)
        returns (address[] memory)
    {
        return _activeMembers[communityId];
    }

    /**
     * @notice Get detailed membership record for a member in a community.
     * @param communityId Community identifier.
     * @param member Wallet address to inspect.
     */
    function getMemberRecord(bytes32 communityId, address member)
        external
        view
        returns (
            bool isActive,
            uint256 firstJoinedAt,
            uint256 lastJoinedAt,
            uint256 leftAt,
            uint256 joinCount
        )
    {
        MemberRecord storage record = _members[communityId][member];
        return (
            record.isActive,
            record.firstJoinedAt,
            record.lastJoinedAt,
            record.leftAt,
            record.joinCount
        );
    }

    /**
     * @notice Get all registered community IDs.
     */
    function getAllCommunityIds() external view returns (bytes32[] memory) {
        return _communityIds;
    }

    /**
     * @notice Get total number of communities created.
     */
    function getTotalCommunitiesCount() external view returns (uint256) {
        return _communityIds.length;
    }

    /**
     * @notice Get community IDs created by a specific address.
     * @param creator Wallet address.
     */
    function getCommunitiesByCreator(address creator)
        external
        view
        returns (bytes32[] memory)
    {
        return _creatorCommunities[creator];
    }

    /**
     * @notice Get community IDs that a user has ever joined.
     * @param user Wallet address.
     */
    function getUserJoinedCommunities(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return _userJoinedCommunities[user];
    }
}


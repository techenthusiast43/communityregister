const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommunityRegister Smart Contract", function () {
  let communityRegister;
  let owner;
  let user1;
  let user2;
  let user3;

  const sampleCommunityId1 = ethers.keccak256(ethers.toUtf8Bytes("web3-developers"));
  const sampleCommunityId2 = ethers.keccak256(ethers.toUtf8Bytes("botchain-pioneers"));

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const CommunityRegister = await ethers.getContractFactory("CommunityRegister");
    communityRegister = await CommunityRegister.deploy();
    await communityRegister.waitForDeployment();
  });

  describe("Community Creation", function () {
    it("should successfully create a new community with valid inputs", async function () {
      const tx = await communityRegister.connect(user1).createCommunity(
        sampleCommunityId1,
        "Web3 Developers",
        "A decentralized hub for developers building on BOT Chain"
      );

      await expect(tx)
        .to.emit(communityRegister, "CommunityCreated")
        .withArgs(
          sampleCommunityId1,
          user1.address,
          "Web3 Developers",
          "A decentralized hub for developers building on BOT Chain",
          await ethers.provider.getBlock("latest").then(b => b.timestamp)
        );

      const comm = await communityRegister.getCommunity(sampleCommunityId1);
      expect(comm.id).to.equal(sampleCommunityId1);
      expect(comm.name).to.equal("Web3 Developers");
      expect(comm.description).to.equal("A decentralized hub for developers building on BOT Chain");
      expect(comm.creator).to.equal(user1.address);
      expect(comm.activeMemberCount).to.equal(0n);

      const allIds = await communityRegister.getAllCommunityIds();
      expect(allIds).to.deep.equal([sampleCommunityId1]);
      expect(await communityRegister.getTotalCommunitiesCount()).to.equal(1n);

      const createdByUser1 = await communityRegister.getCommunitiesByCreator(user1.address);
      expect(createdByUser1).to.deep.equal([sampleCommunityId1]);
    });

    it("should revert if community ID is bytes32(0)", async function () {
      await expect(
        communityRegister.connect(user1).createCommunity(
          ethers.ZeroHash,
          "Invalid ID",
          "Description"
        )
      ).to.be.revertedWithCustomError(communityRegister, "InvalidCommunityId");
    });

    it("should revert if name or description is empty", async function () {
      await expect(
        communityRegister.connect(user1).createCommunity(
          sampleCommunityId1,
          "",
          "Description"
        )
      ).to.be.revertedWithCustomError(communityRegister, "EmptyName");

      await expect(
        communityRegister.connect(user1).createCommunity(
          sampleCommunityId1,
          "Valid Name",
          ""
        )
      ).to.be.revertedWithCustomError(communityRegister, "EmptyDescription");
    });

    it("should revert if community with the same ID already exists", async function () {
      await communityRegister.connect(user1).createCommunity(
        sampleCommunityId1,
        "Original Community",
        "Original Description"
      );

      await expect(
        communityRegister.connect(user2).createCommunity(
          sampleCommunityId1,
          "Duplicate Community",
          "Duplicate Description"
        )
      ).to.be.revertedWithCustomError(communityRegister, "CommunityAlreadyExists");
    });
  });

  describe("Community Updates & Authorization", function () {
    beforeEach(async function () {
      await communityRegister.connect(user1).createCommunity(
        sampleCommunityId1,
        "Initial Name",
        "Initial Description"
      );
    });

    it("should allow the creator to update community details", async function () {
      await expect(
        communityRegister.connect(user1).updateCommunity(
          sampleCommunityId1,
          "Updated Name",
          "Updated Description"
        )
      )
        .to.emit(communityRegister, "CommunityUpdated")
        .withArgs(
          sampleCommunityId1,
          "Updated Name",
          "Updated Description",
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );

      const comm = await communityRegister.getCommunity(sampleCommunityId1);
      expect(comm.name).to.equal("Updated Name");
      expect(comm.description).to.equal("Updated Description");
    });

    it("should revert if non-creator tries to update details", async function () {
      await expect(
        communityRegister.connect(user2).updateCommunity(
          sampleCommunityId1,
          "Hacked Name",
          "Hacked Description"
        )
      ).to.be.revertedWithCustomError(communityRegister, "NotCommunityCreator");
    });

    it("should revert updates to non-existent communities", async function () {
      await expect(
        communityRegister.connect(user1).updateCommunity(
          sampleCommunityId2,
          "Ghost Name",
          "Ghost Description"
        )
      ).to.be.revertedWithCustomError(communityRegister, "CommunityDoesNotExist");
    });
  });

  describe("Membership: Joining, Leaving, and Rejoining", function () {
    beforeEach(async function () {
      await communityRegister.connect(user1).createCommunity(
        sampleCommunityId1,
        "Web3 Developers",
        "Hub"
      );
      await communityRegister.connect(user2).createCommunity(
        sampleCommunityId2,
        "BOT Chain Pioneers",
        "Pioneers Hub"
      );
    });

    it("should allow a wallet to join a community and update counts and members list", async function () {
      expect(await communityRegister.isMember(sampleCommunityId1, user2.address)).to.be.false;

      await expect(communityRegister.connect(user2).joinCommunity(sampleCommunityId1))
        .to.emit(communityRegister, "MemberJoined")
        .withArgs(
          sampleCommunityId1,
          user2.address,
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1),
          1n
        );

      expect(await communityRegister.isMember(sampleCommunityId1, user2.address)).to.be.true;
      expect(await communityRegister.getMemberCount(sampleCommunityId1)).to.equal(1n);

      const members = await communityRegister.getMembers(sampleCommunityId1);
      expect(members).to.deep.equal([user2.address]);

      const record = await communityRegister.getMemberRecord(sampleCommunityId1, user2.address);
      expect(record.isActive).to.be.true;
      expect(record.joinCount).to.equal(1n);
      expect(record.firstJoinedAt).to.be.greaterThan(0n);
    });

    it("should prevent duplicate membership (cannot join twice)", async function () {
      await communityRegister.connect(user2).joinCommunity(sampleCommunityId1);

      await expect(
        communityRegister.connect(user2).joinCommunity(sampleCommunityId1)
      ).to.be.revertedWithCustomError(communityRegister, "AlreadyMember");
    });

    it("should allow a single wallet to join multiple distinct communities", async function () {
      await communityRegister.connect(user3).joinCommunity(sampleCommunityId1);
      await communityRegister.connect(user3).joinCommunity(sampleCommunityId2);

      expect(await communityRegister.isMember(sampleCommunityId1, user3.address)).to.be.true;
      expect(await communityRegister.isMember(sampleCommunityId2, user3.address)).to.be.true;

      const user3Joined = await communityRegister.getUserJoinedCommunities(user3.address);
      expect(user3Joined).to.deep.equal([sampleCommunityId1, sampleCommunityId2]);
    });

    it("should allow active members to leave the community", async function () {
      await communityRegister.connect(user2).joinCommunity(sampleCommunityId1);
      await communityRegister.connect(user3).joinCommunity(sampleCommunityId1);

      expect(await communityRegister.getMemberCount(sampleCommunityId1)).to.equal(2n);

      // user2 leaves
      await expect(communityRegister.connect(user2).leaveCommunity(sampleCommunityId1))
        .to.emit(communityRegister, "MemberLeft")
        .withArgs(
          sampleCommunityId1,
          user2.address,
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1),
          1n
        );

      expect(await communityRegister.isMember(sampleCommunityId1, user2.address)).to.be.false;
      expect(await communityRegister.isMember(sampleCommunityId1, user3.address)).to.be.true;
      expect(await communityRegister.getMemberCount(sampleCommunityId1)).to.equal(1n);

      const activeMembers = await communityRegister.getMembers(sampleCommunityId1);
      expect(activeMembers).to.deep.equal([user3.address]);

      const record = await communityRegister.getMemberRecord(sampleCommunityId1, user2.address);
      expect(record.isActive).to.be.false;
      expect(record.leftAt).to.be.greaterThan(0n);
    });

    it("should revert if a non-member tries to leave", async function () {
      await expect(
        communityRegister.connect(user2).leaveCommunity(sampleCommunityId1)
      ).to.be.revertedWithCustomError(communityRegister, "NotActiveMember");
    });

    it("should allow members who left to rejoin and preserve historical record", async function () {
      await communityRegister.connect(user2).joinCommunity(sampleCommunityId1);
      const initialRecord = await communityRegister.getMemberRecord(sampleCommunityId1, user2.address);
      const initialJoinedAt = initialRecord.firstJoinedAt;

      // Leave
      await communityRegister.connect(user2).leaveCommunity(sampleCommunityId1);
      expect(await communityRegister.isMember(sampleCommunityId1, user2.address)).to.be.false;

      // Rejoin
      await communityRegister.connect(user2).joinCommunity(sampleCommunityId1);
      expect(await communityRegister.isMember(sampleCommunityId1, user2.address)).to.be.true;
      expect(await communityRegister.getMemberCount(sampleCommunityId1)).to.equal(1n);

      const rejoinedRecord = await communityRegister.getMemberRecord(sampleCommunityId1, user2.address);
      expect(rejoinedRecord.isActive).to.be.true;
      expect(rejoinedRecord.joinCount).to.equal(2n);
      // firstJoinedAt remains preserved
      expect(rejoinedRecord.firstJoinedAt).to.equal(initialJoinedAt);
      expect(rejoinedRecord.lastJoinedAt).to.be.greaterThanOrEqual(initialJoinedAt);
    });
  });

  describe("Member Verification & Query Integrity", function () {
    it("should accurately return verification status for any community and wallet address", async function () {
      await communityRegister.connect(user1).createCommunity(
        sampleCommunityId1,
        "DAO Group",
        "DAO governance"
      );

      // Not joined yet
      expect(await communityRegister.isMember(sampleCommunityId1, user3.address)).to.be.false;

      // Join
      await communityRegister.connect(user3).joinCommunity(sampleCommunityId1);
      expect(await communityRegister.isMember(sampleCommunityId1, user3.address)).to.be.true;

      // Leave
      await communityRegister.connect(user3).leaveCommunity(sampleCommunityId1);
      expect(await communityRegister.isMember(sampleCommunityId1, user3.address)).to.be.false;

      // Non-existent community check
      expect(await communityRegister.isMember(sampleCommunityId2, user3.address)).to.be.false;
    });

    it("should revert getCommunity or getMemberCount for non-existent community", async function () {
      await expect(
        communityRegister.getCommunity(sampleCommunityId1)
      ).to.be.revertedWithCustomError(communityRegister, "CommunityDoesNotExist");

      await expect(
        communityRegister.getMemberCount(sampleCommunityId1)
      ).to.be.revertedWithCustomError(communityRegister, "CommunityDoesNotExist");

      await expect(
        communityRegister.getMembers(sampleCommunityId1)
      ).to.be.revertedWithCustomError(communityRegister, "CommunityDoesNotExist");
    });
  });
});


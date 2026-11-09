require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const rawKey = (process.env.PRIVATE_KEY || "").trim().replace(/^["']|["']$/g, "");
const formattedKey = rawKey ? (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) : null;
const accounts = formattedKey && formattedKey.length === 66 ? [formattedKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    botchainTestnet: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts: accounts,
    },
    botchainMainnet: {
      url: "https://rpc.botchain.ai",
      chainId: 677,
      accounts: accounts,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./src/artifacts",
  },
};


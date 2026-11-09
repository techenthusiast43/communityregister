const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`\n==================================================`);
  console.log(` Deploying CommunityRegister to ${network.name}`);
  console.log(` Chain ID: ${network.config.chainId}`);
  console.log(`==================================================\n`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account configured. Check PRIVATE_KEY in .env");
  }

  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);

  const CommunityRegister = await ethers.getContractFactory("CommunityRegister");
  console.log("Deploying contract...");
  const contract = await CommunityRegister.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n>>> CommunityRegister successfully deployed to: ${contractAddress}`);
  console.log(`>>> Explorer: ${network.config.chainId === 968 ? "https://scan.bohr.life/address/" : "https://scan.botchain.ai/address/"}${contractAddress}\n`);

  // Save address and ABI for frontend integration
  const deployedDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(deployedDir)) {
    fs.mkdirSync(deployedDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
  };

  const addressesFile = path.join(deployedDir, "deployedAddresses.json");
  let existingData = {};
  if (fs.existsSync(addressesFile)) {
    try {
      existingData = JSON.parse(fs.readFileSync(addressesFile, "utf8"));
    } catch (e) {
      existingData = {};
    }
  }

  existingData[network.config.chainId] = deploymentData;
  fs.writeFileSync(addressesFile, JSON.stringify(existingData, null, 2));
  console.log(`Saved deployment info to: ${addressesFile}`);

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    const envKey = network.config.chainId === 968 
      ? "VITE_COMMUNITY_REGISTER_ADDRESS_TESTNET" 
      : "VITE_COMMUNITY_REGISTER_ADDRESS_MAINNET";

    const regex = new RegExp(`^${envKey}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${envKey}=${contractAddress}`);
    } else {
      envContent += `\n${envKey}=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated ${envKey} in .env`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


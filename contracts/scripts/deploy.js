const hre = require("hardhat");

async function main() {
  const [deployer, guardian1, guardian2] = await hre.ethers.getSigners();

  const owner = deployer.address;
  const entryPoint = process.env.ENTRY_POINT || deployer.address;

  const guardianThreshold = hre.ethers.parseEther("1");
  const newRecipientDelay = 24 * 60 * 60;
  const dailyLimit = hre.ethers.parseEther("5");
  const baseWithdrawalDelay = 0;

  const GuardianModule = await hre.ethers.getContractFactory("GuardianModule");
  const guardianModule = await GuardianModule.deploy(owner, [guardian1.address, guardian2.address], 1);
  await guardianModule.waitForDeployment();

  const PolicyEngine = await hre.ethers.getContractFactory("PolicyEngine");
  const policyEngine = await PolicyEngine.deploy(owner, guardianThreshold, newRecipientDelay);
  await policyEngine.waitForDeployment();

  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    owner,
    entryPoint,
    await policyEngine.getAddress(),
    await guardianModule.getAddress(),
    dailyLimit,
    baseWithdrawalDelay
  );
  await vault.waitForDeployment();

  console.log("GuardianModule:", await guardianModule.getAddress());
  console.log("PolicyEngine:", await policyEngine.getAddress());
  console.log("Vault:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

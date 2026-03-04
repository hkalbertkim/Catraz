const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Catraz Vault Architecture", function () {
  async function deployFixture() {
    const [owner, guardianA, guardianB, recipient] = await ethers.getSigners();

    const GuardianModule = await ethers.getContractFactory("GuardianModule");
    const guardianModule = await GuardianModule.deploy(owner.address, [guardianA.address, guardianB.address], 1);

    const PolicyEngine = await ethers.getContractFactory("PolicyEngine");
    const threshold = ethers.parseEther("1");
    const delay = 24 * 60 * 60;
    const policyEngine = await PolicyEngine.deploy(owner.address, threshold, delay);

    const Vault = await ethers.getContractFactory("Vault");
    const dailyLimit = ethers.parseEther("10");
    const vault = await Vault.deploy(
      owner.address,
      owner.address,
      await policyEngine.getAddress(),
      await guardianModule.getAddress(),
      dailyLimit,
      0
    );

    return { owner, guardianA, recipient, vault, guardianModule };
  }

  it("queues new recipient transfer with 24h delay", async function () {
    const { vault, recipient } = await deployFixture();
    const tx = await vault.queueTransfer(recipient.address, ethers.parseEther("0.1"), "0x");
    const receipt = await tx.wait();

    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "Queued");
    expect(event.args.eta).to.be.gt(0);
    expect(event.args.requiresGuardian).to.equal(false);
  });

  it("requires guardian approval when value exceeds threshold", async function () {
    const { vault, guardianModule, guardianA, recipient } = await deployFixture();

    const tx = await vault.queueTransfer(recipient.address, ethers.parseEther("2"), "0x");
    const receipt = await tx.wait();
    const event = receipt.logs.find((log) => log.fragment && log.fragment.name === "Queued");
    const operationId = event.args.operationId;

    expect(await guardianModule.isOperationApproved(operationId)).to.equal(false);
    await guardianModule.connect(guardianA).approveOperation(operationId);
    expect(await guardianModule.isOperationApproved(operationId)).to.equal(true);
  });
});

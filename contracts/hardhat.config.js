require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  }
};

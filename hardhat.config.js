require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

const private_key = process.env.PRIVATE_KEY;
const matic_url = process.env.MATIC_RPC_URL;
const mumbai_url = process.env.MUMBAI_RPC_URL;

module.exports = {
  defaultNetwork: "hardhat",
  network: {
    mumbai: {
      url: mumbai_url,
      accounts: [`0x${private_key}`]
    },
    mainnet: {
      url: matic_url,
      accounts: [private_key]
    },
    hardhat: {
      chainId: 1337
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};

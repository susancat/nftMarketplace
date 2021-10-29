require("@nomiclabs/hardhat-waffle");
const private_key = process.env.PRIVATE_KEY;
const matic_url = process.env.MATIC_RPC_URL;
const mumbai_url = process.env.MUMBAI_RPC_URL;

module.exports = {
  network: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: mumbai_url,
      accounts: [private_key]
      //where to deploy the contract, but for local network test,no need
    },
    mainnet: {
      url: matic_url,
      accounts: [private_key]
    }
  },
  solidity: "0.8.4",
};

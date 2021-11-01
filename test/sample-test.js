const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function() {
  it("Should create and execute market sales", async function() {
    //get a reference to contracts
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = nft.address;

    //after contracts deployed can interact with functions one by one
    let listingPrice = await market.getListingPrice();
    //need to turn the uint to string to interact with it???
    listingPrice = listingPrice.toString();
    //auction price is how much we sell the items for
    //the first parameter is a value string, represent of amount of Wei,we use 100 cause it's MATIC(cheap); 2rd would be a 3-18 decimals or a name such as gwei
    const auctionPrice = ethers.utils.parseUnits('100', 'ether');

    //create NFT function from NFT contract, parameter is tokenURI
    await nft.createToken("https://www.mytokenlocation.com");
    await nft.createToken("https://www.mytokenlocation2.com");
    //no idea here about the 4th parameter
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice });
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice });

    //in real env, nftContractAddress will get address from users' account, but here we use some pre-built testing accounts
    const [_, buyerAddress] = await ethers.getSigners();
    //buyerAddress is a pre-biult address array, by default it will use the 1st address, but we can clarify to use secondAddress: [_, buyerAddress, secondAddress, thirdAddress]
    //contract.connect(address) is from ethers.js, address can be contract Provider or contract singer
    //for provider it returns a downgraded read-only contract; for signer, it returns a contract act on behalf of the signer
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice});

    let items = await market.fetchMarketItems();
    //map over all the items and update the value
    //struct item, but why toString()?
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId);
      let item = {
        //price and tokenId are bigNumber, if not turn to string(can be read, make sense) would be hex hash
        price: i.price.toString(),//returns a wei
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item;
    }))
    console.log('items: ', items)

  });
});

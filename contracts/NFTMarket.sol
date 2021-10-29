// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol" ;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol" ;
//easy to write nnumber counter

contract NFTMarket is ReentrancyGuard{
    using Counters for Counters.Counter;//it has a default value 0
    //two counters here, one for counting NFT ids(number),one for counting sold NFTs
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    //owner of the contract: seller--listing fee / buyer -- transaction fee
    address payable owner;
    uint256 listingPrice = 0.025 ether;//ether is a 18 decimal number but no need to use them all here;or you can also use GWei
    //0.025 MATIC is low,but for eth too expensive

    constructor(){
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping (uint256 => MarketItem) private idToMarketItem;

    //create an event which emitted each time a new NFT created
    //indexed here used for quicker search
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    //return the listing price to make sure we get right price for the contract
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    //NEW: creating a market item (by contract) with its id and price, and putting it for sale
    function createMarketItem(
        address nftContract, 
        uint256 tokenId, 
        uint256 price
        ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        //mapping: key itemId with a new created market Item as its value (mapping[key] = value)
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),//first time mint
            payable(address(0)),//equals to NullAddress
            price,
            false
        );

        //TRANSFER: create a market sale for selling between parties
        //cound also use safeTransferFrom(), or _safeTransfer()
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        //address(this) is contract address, the NFT transfer from current owner to a contract?
        emit MarketItemCreated(
            itemId,//same to parameters in event
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
    }

    //no need price parameter cause it's already known when creating
    function createMarketSale(address nftContract, uint256 itemId) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;//the MarketItem's price
        uint tokenId = idToMarketItem[itemId].tokenId;//the MarketItem's tokenId
        //so it's not for bid (otherwise should allow value >= price)
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        //transfer money to
        idToMarketItem[itemId].seller.transfer(msg.value);
        //NFT transferred from contract address to the current sender(buyer)
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        //manully update the NFT info with owner and if sold
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;

        _itemsSold.increment();
        payable(owner).transfer(listingPrice);//new owner pay the money
    }

    //the following 3 functions work like filters (actually they make clones from backend), but they don't change contract so they are view methods
    //1. UNSOLD: returns all the unsold items in the market (the owner is the contract: NullAddress, not minted by anyone, firsthand)
    function fetchMarketItems() public view returns(MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        //know how many unsold items and create a new array for all unsold items
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        //loop and check if the current owner is NullAddress(unsold), rather than just check bool sold's value
        for(uint i = 0; i < itemCount; i++) {
            //it start from 1 because when the 1st NFT created, original Counter.counter (default 0)+1
            if(idToMarketItem[i + 1].owner == address(0)) {
                uint currentId = idToMarketItem[i + 1].itemId;
                //create a NFT clone and saved under unsold array
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                //use insert here because we create a fixed length array, so we don't use push here
                currentIndex += 1;
            }
        }
        return items;
    }

    //2. My NFTs: return the item the current user has owned
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        //the loop below just for getting the array length
        for (uint i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++){
            if(idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId;
                //create a NFT clone and saved under myNFT array
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    //3. CREATED: returns all the items created/sold by the current user
    function fetchItemsCreated() public view returns(MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);  
        for (uint i = 0; i < totalItemCount; i++){
            if(idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId;
                //create a NFT clone and saved under myNFT array
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }     
        return items; 
    }
}
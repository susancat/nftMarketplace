// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol" ;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol" ;
//easy to write nnumber counter

contract NFTMarket is ReentrancyGuard{
    using Counters for Counters.Counter;
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
}
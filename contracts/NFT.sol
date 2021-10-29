// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol" ;
//easy to write nnumber counter
//ERC721URIStorage is also an inherit from ERC721
contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    //could have several counters,and here we only use one counter
    Counters.Counter private _tokenIds;
    address contractAddress;
    //the address of marketplace
    constructor(address marketplaceAddress) ERC721("Metaverse Tokens","METT"){
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment(); //equals to _tokenId++
        uint256 newItemId = _tokenIds.current();//new token's id equals to current value of _tokenId which ++

        _mint(msg.sender, newItemId); //didn't use _safeMint here
        _setTokenURI(newItemId, tokenURI);//it comes from ERC721URIStorage.sol;
        setApprovalForAll(contractAddress, true);//give marketplace approval to transac token between users
        return newItemId;//so it can interact with the client app like mint and sale and transact
    }
}
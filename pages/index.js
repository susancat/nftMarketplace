//everything you see in the homepage
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import Image from 'next/image';
import { nftaddress, nftmarketaddress } from '../config';
//ABI allow contract interaction with client-side app

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs()
  },[]);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    //new ethers.Contract( address , abi , signerOrProvider )
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      //use below to show price as "MATIC/ETH" rather than wei with 18 "0"
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }
  //allow users connect to their wallet and buy NFTs
  async function buyNFTs(nft) {
    //instance and event emit
    const web3Modal = new Web3Modal()
    //if users connect to wallet there's a connection
    const connection = await web3Modal.connect()
    //provider use user's address, here we use web3Provider instead of RPC provider(when loadNFTs)
    const provider = new ethers.providers.Web3Provider(connection)

    //we need user's address and then need them to sign the contract, and execute the actual transaction
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    //nftaddress comes from config.js; create a sale
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, { value: price })
    await transaction.wait()
    loadNFTs()
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  )

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => {
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image src={nft.image} alt="" />
                <div className="p-4">
                  <p className="text-2xl font-semibold" style={{ height: '64px' }}>{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden'}}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNFTs(nft)}>Buy</button>
                </div>
              </div>
            })
          }
        </div>
      </div>
    </div>
  )
}

import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal';

import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
const client = ipfsHttpClient('https:/ipfs.infura.io:5001/api/v0')

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState( { price: '', name: '', description: ''})
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add (
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)//print the file uploaded
                }
            )
            //locate the uploaded file by its path
            const url = `https:/ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch(e) {
            console.log(e)
        }
    }

   async function createItem() {
       const { name, description, price } = formInput
       //return blank and not list the item if there is no full metadata 
       if(!name || !description || !price ||!fileUrl) return 
       //stringify the metadata
       const data = JSON.stringify({
           name, description, image:fileUrl
       })
       try {
           const added = await client.add(data)
           const url = `https:/ipfs.infura.io/ipfs/${added.path}`
           createSale(url)
       } catch(error) {
           console.log('Error uploading file: ', error)
       }
   }

   async function createSale() {
       const web3Modal = new Web3Modal()
       const connection = await web3Modal.connect()
       const provider = new ethers.providers.Web3Provider(connection)
       const signer = provider.getSigner()

       let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
       let transaction = await contract.createToken(url)//in NFT contract sol file
       let tx = await transaction.wait()//wait until it generated
        
       //get tokenId from the above transaction, but we can't just wait for it returns and use it
        //use event to modify the return value
        let event = tx.events[0] //get the 0 item
        let value = event. args[2]//3rd items in args[]
        let tokenId = value.toNumber()

        const price = ethers.utils.parseUnits(formInput.price, 'ether')

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        //contract initialized as a NFT, now it's re-refered as NFT market
        let listingPrice = listingPrice.toString()

        transaction = await contract.createMarketItem(
            nftaddress, tokenId, price, { value: listingPrice }//will be extract from user;s wallet
        )
        await transaction.wait()
        router.push('/')//redirect users to home page
   }
   return (
       <div className="flex justify-center">
           <div className="w-1 flex flex-col pb-12">
               <input 
                placeholder="Asset Name"
                className="mt-8 border rounded p-4"
                onChange={e => updateFormInput({
                    ...formInput, name: e.target.value
                })}         
               />
               <textarea 
                placeholder="Asset Description"
                className="mt-8 border rounded p-4"
                onChange={e => updateFormInput({
                    ...formInput, description: e.target.value
                })}         
               />
               <input 
                placeholder="Asset Price in Matic"
                className="mt-8 border rounded p-4"
                onChange={e => updateFormInput({
                    ...formInput, price: e.target.value
                })}  
                />     
                <input 
                type="file"
                name="Asset"
                className="my-4"
                onChange={onChange}     
               />
               <button onClick={createMarket} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                   Create Digital Asset
                </button>
            </div>
       </div>
   )
}
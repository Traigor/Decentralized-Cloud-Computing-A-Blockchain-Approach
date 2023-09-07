import React from 'react'
import { CButton, CForm, CFormLabel, CFormInput } from '@coreui/react'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'
import { keccak256 } from '@ethersproject/keccak256'
import { toUtf8Bytes } from '@ethersproject/strings'

function Auction() {
  const [contract, setContract] = useState(null)
  const [clientVerification, setClientVerification] = useState('')
  const [auctionDeadline, setAuctionDeadline] = useState(600)
  const [taskDeadline, setTaskDeadline] = useState(600)
  const [ipfsCode, setIpfsCode] = useState('')

  useEffect(() => {
    const contractData = async () => {
      const provider = new Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        AuctionsManagerSepolia.address,
        AuctionsManagerSepolia.abi,
        signer,
      )
      setContract(contract)
    }

    contractData()
  }, [])

  useEffect(() => {
    if (contract) {
      const auctionCreatedHandler = (auctionID, client, provider) => {
        if (provider === window.ethereum.selectedAddress) alert(`AuctionCreated: ${auctionID}`)
      }

      contract.on('AuctionCreated', auctionCreatedHandler)

      return () => {
        contract.off('AuctionCreated', auctionCreatedHandler)
      }
    }
  }, [contract])

  const handleClientVerificationChange = (event) => {
    setClientVerification(event.target.value)
  }

  const handleAuctionDeadlineChange = (event) => {
    setAuctionDeadline(event.target.value)
  }

  const handleTaskDeadlineChange = (event) => {
    setTaskDeadline(event.target.value)
  }

  const handleIpfsCodeChange = (event) => {
    setIpfsCode(event.target.value)
  }

  function verifyString(inputString) {
    return inputString && typeof inputString === 'string' && inputString.trim() !== ''
  }

  const btnhandler = async () => {
    if (verifyString(clientVerification)) {
      const verificationHash = keccak256(toUtf8Bytes(clientVerification))
      // const auctionID = keccak256(
      //   toUtf8Bytes(Date.now() + clientVerification + auctionDeadline + taskDeadline + ipfsCode),
      // )
      console.log('VER', clientVerification)
      console.log('HASH', verificationHash)
      console.log('TASK', taskDeadline)
      console.log('AUCTION', auctionDeadline)
      console.log('IPFS', ipfsCode)
      await contract.createAuction(auctionDeadline, taskDeadline, verificationHash, ipfsCode)
    } else {
      alert('Invalid verification')
    }
  }

  return (
    <div className="App">
      <CForm>
        <div className="mb-3">
          <CFormLabel htmlFor="auctionDeadline">Auction Deadline</CFormLabel>
          <CFormInput
            type="number"
            id="auctionDeadline"
            value={auctionDeadline}
            onChange={handleAuctionDeadlineChange}
            step={10}
            min={10}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="taskDeadline">Task Deadline</CFormLabel>
          <CFormInput
            type="number"
            id="taskDeadline"
            value={taskDeadline}
            onChange={handleTaskDeadlineChange}
            step={10}
            min={10}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="verification">Verification</CFormLabel>
          <CFormInput
            type="string"
            id="verification"
            value={clientVerification}
            onChange={handleClientVerificationChange}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="ipfsCode">IPFS CID</CFormLabel>
          <CFormInput
            type="string"
            id="ipfsCode"
            value={ipfsCode}
            onChange={handleIpfsCodeChange}
          />
        </div>
      </CForm>
      <Card className="text-center">
        <CButton color="primary" onClick={btnhandler}>
          Create Auction
        </CButton>
      </Card>
    </div>
  )
}

export default Auction

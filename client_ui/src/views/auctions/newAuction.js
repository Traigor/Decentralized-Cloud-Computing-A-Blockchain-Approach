import React from 'react'
import { CButton, CForm, CFormLabel, CFormInput, CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import AuctionsManagerMumbai from '../../constants/AuctionsManagerMumbai.json'
import { Web3Provider } from '@ethersproject/providers'
import { keccak256 } from '@ethersproject/keccak256'
import { toUtf8Bytes } from '@ethersproject/strings'
import compareAddresses from '../../utils/compareAddresses.js'

function Auction() {
  const [contract, setContract] = useState(null)
  const [clientVerification, setClientVerification] = useState('')
  const [auctionDeadline, setAuctionDeadline] = useState(600)
  const [taskDeadline, setTaskDeadline] = useState(600)
  const [ipfsCode, setIpfsCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [auctionID, setAuctionID] = useState(null)

  useEffect(() => {
    const contractData = async () => {
      const provider = new Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        AuctionsManagerSepolia.address,
        AuctionsManagerSepolia.abi,
        // AuctionsManagerMumbai.address,
        // AuctionsManagerMumbai.abi,
        signer,
      )
      setContract(contract)
    }

    contractData()
  }, [])

  useEffect(() => {
    if (contract) {
      const auctionCreatedHandler = (auctionID, client, provider) => {
        if (compareAddresses(client, window.ethereum.selectedAddress)) {
          setLoading(false)
          setVisible(true)
          setAuctionID(auctionID)

          setTimeout(() => {
            setVisible(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
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

      setLoading(true)
      await contract.createAuction(auctionDeadline, taskDeadline, verificationHash, ipfsCode)
    } else {
      alert('Invalid verification')
    }
  }

  return (
    <div className="App">
      <CForm>
        <div className="mb-3">
          <CFormLabel htmlFor="auctionDeadline">Auction Deadline (sec)</CFormLabel>
          <CFormInput
            type="number"
            id="auctionDeadline"
            value={auctionDeadline}
            onChange={handleAuctionDeadlineChange}
            step={10}
            min={60}
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="taskDeadline">Task Deadline (sec)</CFormLabel>
          <CFormInput
            type="number"
            id="taskDeadline"
            value={taskDeadline}
            onChange={handleTaskDeadlineChange}
            step={10}
            min={60}
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
          {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
          {''} Create Auction
        </CButton>
      </Card>

      {visible ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Auction created successfully with ID: {auctionID}</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default Auction

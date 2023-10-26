import React from 'react'
import { CButton, CTable } from '@coreui/react'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import AuctionsManagerMumbai from '../../constants/AuctionsManagerMumbai.json'
import { Web3Provider } from '@ethersproject/providers'
import compareAddresses from 'src/utils/compareAddresses'

function ActiveBids() {
  const [auctionContract, setAuctionContract] = useState(null)
  const [auctions, setAuctions] = useState(null)
  const [visibleAuctions, setVisibleAuctions] = useState(false)

  useEffect(() => {
    const contractData = async () => {
      const provider = new Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const auctionContract = new ethers.Contract(
        AuctionsManagerSepolia.address,
        AuctionsManagerSepolia.abi,
        // AuctionsManagerMumbai.address,
        // AuctionsManagerMumbai.abi,
        signer,
      )
      setAuctionContract(auctionContract)
    }

    contractData()
  }, [])

  const getAuctionsBtnHandler = async () => {
    setVisibleAuctions(!visibleAuctions)
    const auctions = await auctionContract.getAuctionActiveBidsByProvider()
    setAuctions(auctions)
  }

  const GWEI = 1000000000
  const auctionsColumns = [
    {
      key: 'auctionID',
      label: 'AuctionID',
      _props: { scope: 'col' },
    },
    {
      key: 'bid',
      label: 'Bid[Gwei]',
      _props: { scope: 'col' },
    },
    {
      key: 'creationTime',
      label: 'Creation',
      _props: { scope: 'col' },
    },
    {
      key: 'auctionDeadline',
      label: 'Deadline',
      _props: { scope: 'col' },
    },
  ]

  const mapAuctions = (auctions) => {
    if (auctions) {
      const mappedAuctions = auctions.map((auction) => {
        return {
          auctionID: auction.auctionID.slice(0, 6) + '...' + auction.auctionID.slice(-4),
          bid:
            auction.providerBids
              .find((bid) => compareAddresses(bid.provider, window.ethereum.selectedAddress))
              .bid.toNumber() / GWEI,
          creationTime: new Date(auction.creationTime.toNumber() * 1000).toLocaleString('en-GB'),
          auctionDeadline: new Date(
            (auction.creationTime.toNumber() + auction.auctionDeadline.toNumber()) * 1000,
          ).toLocaleString('en-GB'),
          deadlineEpoch: auction.creationTime.toNumber() + auction.auctionDeadline.toNumber(),
        }
      })
      //sort auctions by deadline time in ascending order
      const sortedAuctions = mappedAuctions.sort((a, b) => {
        if (a.deadlineEpoch === 0 && b.deadlineEpoch === 0) {
          return 0
        } else if (a.deadlineEpoch === 0) {
          return 1
        } else if (b.deadlineEpoch === 0) {
          return -1
        } else {
          return a.deadlineEpoch - b.deadlineEpoch
        }
      })
      return sortedAuctions
    }
  }

  return (
    <div className="App">
      <Card className="text-center">
        <CButton color="info" onClick={getAuctionsBtnHandler}>
          My Active Bids
        </CButton>
      </Card>
      <Card className="text-center">
        {visibleAuctions && auctions ? (
          <CTable columns={auctionsColumns} items={mapAuctions(auctions)} />
        ) : null}
      </Card>
    </div>
  )
}

export default ActiveBids

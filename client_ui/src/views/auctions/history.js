import React from 'react'
import { CButton, CTable } from '@coreui/react'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'

function GetBids() {
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
        signer,
      )
      setAuctionContract(auctionContract)
    }

    contractData()
  }, [])

  const getAuctionsBtnHandler = async () => {
    setVisibleAuctions(!visibleAuctions)
    if (window.ethereum.selectedAddress) {
      const auctions = await auctionContract.getAuctionsByClient(window.ethereum.selectedAddress)
      setAuctions(auctions)
    }
  }

  const auctionsColumns = [
    {
      key: 'auctionID',
      label: 'AuctionID',
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
    {
      key: 'auctionState',
      label: 'State',
      _props: { scope: 'col' },
    },
  ]

  const AuctionState = {
    0: 'Created',
    1: 'Cancelled',
    2: 'Finalized',
  }

  const mapAuctions = (auctions) => {
    if (auctions) {
      const mappedAuctions = auctions.map((auction) => {
        return !auction.auctionState === 0 ||
          auction.creationTime.toNumber() + auction.auctionDeadline.toNumber() <
            Math.floor(Date.now() / 1000)
          ? {
              auctionID: auction.auctionID.slice(0, 6) + '...' + auction.auctionID.slice(-4),
              creationTime: new Date(auction.creationTime.toNumber() * 1000).toLocaleString(
                'en-GB',
              ),
              auctionDeadline: new Date(
                (auction.creationTime.toNumber() + auction.auctionDeadline.toNumber()) * 1000,
              ).toLocaleString('en-GB'),
              auctionState: AuctionState[auction.auctionState],
            }
          : {}
      })
      //sort auctions by deadline date in descending order
      const sortedAuctions = mappedAuctions.sort((a, b) => {
        if (a.creationTime === '-' && b.creationTime === '-') {
          return 0
        } else if (a.creationTime === '-') {
          return -1
        } else if (b.creationTime === '-') {
          return 1
        } else {
          return new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
        }
      })
      return sortedAuctions
    }
  }

  return (
    <div className="App">
      <Card className="text-center">
        <CButton color="info" onClick={getAuctionsBtnHandler}>
          My Completed Auctions
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

export default GetBids

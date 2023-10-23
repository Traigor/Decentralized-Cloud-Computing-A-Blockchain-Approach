import React from 'react'
import { CButton, CTable } from '@coreui/react'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import AuctionsManagerMumbai from '../../constants/AuctionsManagerMumbai.json'
import { Web3Provider } from '@ethersproject/providers'

function History() {
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
    const auctions = await auctionContract.getAuctionWinnersByProvider()
    setAuctions(auctions)
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
    {
      key: 'taskID',
      label: 'TaskID',
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
        return auction.auctionState !== 0
          ? {
              auctionID: auction.auctionID.slice(0, 6) + '...' + auction.auctionID.slice(-4),
              creationTime: new Date(auction.creationTime.toNumber() * 1000).toLocaleString(
                'en-GB',
              ),
              auctionDeadline: new Date(
                (auction.creationTime.toNumber() + auction.auctionDeadline.toNumber()) * 1000,
              ).toLocaleString('en-GB'),
              auctionState: AuctionState[auction.auctionState],
              taskID:
                // eslint-disable-next-line
                auction.taskID != 0
                  ? auction.taskID.slice(0, 6) + '...' + auction.taskID.slice(-4)
                  : '-',
              creationEpoch: auction.creationTime.toNumber(),
            }
          : {}
      })
      //sort auctions by creation time in descending order
      const sortedAuctions = mappedAuctions.sort((a, b) => {
        if (a.creationEpoch === 0 && b.creationEpoch === 0) {
          return 0
        } else if (a.creationEpoch === 0) {
          return -1
        } else if (b.creationEpoch === 0) {
          return 1
        } else {
          return b.creationEpoch - a.creationEpoch
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

export default History

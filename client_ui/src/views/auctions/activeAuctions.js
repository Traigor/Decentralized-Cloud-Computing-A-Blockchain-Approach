import React from 'react'
import { CButton, CTable, CFormCheck, CSpinner, CAlert, CTooltip } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'
import calculateScore from '../../utils/score'
import compareAddresses from 'src/utils/compareAddresses'
import getClientCollateral from 'src/utils/getClientCollateral'

function GetBids() {
  const [auctionContract, setAuctionContract] = useState(null)
  const [taskContract, setTaskContract] = useState(null)
  const [bids, setBids] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [auctions, setAuctions] = useState(null)
  const [auctionID, setAuctionID] = useState(null)
  const [selectedAuctionRadio, setSelectedAuctionRadio] = useState(null)
  const [selectedBidRadio, setSelectedBidRadio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visibleTask, setVisibleTask] = useState(false)
  const [taskID, setTaskID] = useState(null)
  const [auctionsSelected, setAuctionsSelected] = useState(false)
  const [bidsSelected, setBidsSelected] = useState(false)
  const [clientCollateral, setClientCollateral] = useState(null)

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
      const taskContract = new ethers.Contract(
        TasksManagerSepolia.address,
        TasksManagerSepolia.abi,
        signer,
      )
      setAuctionContract(auctionContract)
      setTaskContract(taskContract)
    }

    contractData()
  }, [])

  const getBidsBtnHandler = async () => {
    setBidsSelected(!bidsSelected)
    const bids = await auctionContract.getAuctionBids(auctionID)
    setBids(bids)
  }

  const getAuctionsBtnHandler = async () => {
    setAuctionsSelected(!auctionsSelected)
    const auctions = await auctionContract.getAuctionsByClient()
    setAuctions(auctions)
  }

  const finalizeBtnHandler = async () => {
    setLoading(true)
    const wei = 1000000000000000000
    const valueEth = ethers.utils.parseEther((clientCollateral / wei).toFixed(18).toString())
    await auctionContract.finalize(auctionID, selectedProvider, { value: valueEth })
  }

  useEffect(() => {
    if (auctionContract && taskContract) {
      const taskCreatedHandler = (taskID, client, provider) => {
        if (compareAddresses(client, window.ethereum.selectedAddress)) {
          setLoading(false)
          setTaskID(taskID)
          setVisibleTask(true)

          setTimeout(() => {
            setVisibleTask(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

      taskContract.on('TaskCreated', taskCreatedHandler)

      return () => {
        taskContract.off('TaskCreated', taskCreatedHandler)
      }
    }
  }, [auctionContract, taskContract])

  const bidRadioHandler = (provider, bid) => {
    setSelectedProvider(provider)
    setClientCollateral(getClientCollateral(bid))
    setSelectedBidRadio(provider)
  }

  const auctionRadioHandler = (auctionID) => {
    setAuctionID(auctionID)
    setSelectedAuctionRadio(auctionID)
  }

  const bidsColumns = [
    {
      key: 'button',
      label: '',
      _props: { scope: 'col' },
    },
    {
      key: 'bid',
      label: 'Bid',
      _props: { scope: 'col' },
    },
    {
      key: 'provider',
      label: 'Provider',
      _props: { scope: 'col' },
    },
    {
      key: 'score',
      label: 'Score(%)',
      _props: { scope: 'col' },
    },
  ]

  const auctionsColumns = [
    {
      key: 'button',
      label: '',
      _props: { scope: 'col' },
    },
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

  const mapBids = (bids) => {
    if (bids) {
      const mappedBids = bids.map((bid) => {
        return {
          button: (
            <CFormCheck
              type="radio"
              name="bidRadio"
              id="bidRadio"
              value="option1"
              onChange={() => bidRadioHandler(bid.provider, bid.bid.toNumber())}
              checked={selectedBidRadio === bid.provider}
            />
          ),
          bid: bid.bid.toNumber(),
          provider: bid.provider,
          score: (
            calculateScore(bid.providerUpVotes.toNumber(), bid.providerDownVotes.toNumber()) * 100
          ).toFixed(2),
        }
      })
      //sort auctions by bid date in ascending order
      const sortedBids = mappedBids.sort((a, b) => {
        return a.bid - b.bid
      })
      return sortedBids
    }
  }

  const AuctionState = {
    0: 'Created',
    1: 'Cancelled',
    2: 'Finalized',
  }

  const mapAuctions = (auctions) => {
    if (auctions) {
      const mappedAuctions = auctions.map((auction) => {
        return auction.auctionState === 0 &&
          auction.creationTime.toNumber() + auction.auctionDeadline.toNumber() >
            Math.floor(Date.now() / 1000)
          ? {
              button: (
                <CFormCheck
                  type="radio"
                  name="auctionRadio"
                  id="auctionRadio"
                  value="option1"
                  onChange={() => auctionRadioHandler(auction.auctionID)}
                  checked={selectedAuctionRadio === auction.auctionID}
                />
              ),
              auctionID: auction.auctionID.slice(0, 6) + '...' + auction.auctionID.slice(-4),
              creationTime: new Date(auction.creationTime.toNumber() * 1000).toLocaleString(
                'en-GB',
              ),
              auctionDeadline: new Date(
                (auction.creationTime.toNumber() + auction.auctionDeadline.toNumber()) * 1000,
              ).toLocaleString('en-GB'),
              auctionState: AuctionState[auction.auctionState],
              deadlineEpoch: auction.creationTime.toNumber() + auction.auctionDeadline.toNumber(),
            }
          : {}
      })
      //sort auctions by deadline time in ascending order
      const sortedAuctions = mappedAuctions.sort((a, b) => {
        if (a.deadlineEpoch === 0 && b.deadlineEpoch === 0) {
          return 0
        } else if (b.deadlineEpoch === 0) {
          return -1
        } else if (a.deadlineEpoch === 0) {
          return 1
        } else {
          return a.deadlineEpoch - b.deadlineEpoch
        }
      })
      return sortedAuctions
    }
  }

  return (
    <div className="App">
      {/* Calling all values which we 
   have stored in usestate */}
      <Card className="text-center">
        <CButton color="primary" onClick={getAuctionsBtnHandler}>
          My Active Auctions
        </CButton>
      </Card>
      <Card className="text-center">
        {auctionsSelected && auctions ? (
          <CTable columns={auctionsColumns} items={mapAuctions(auctions)} />
        ) : null}
      </Card>
      <Card className="text-center">
        {auctionID ? (
          <CButton color="info" onClick={getBidsBtnHandler}>
            Get Bids
          </CButton>
        ) : null}
      </Card>
      <Card className="text-center">
        {bidsSelected && bids ? <CTable columns={bidsColumns} items={mapBids(bids)} /> : null}
      </Card>
      <Card className="text-center">
        {bidsSelected && bids ? (
          <CTooltip
            content={`You will be charged ${clientCollateral} wei as collateral`}
            placement="bottom"
          >
            <CButton color="success" onClick={finalizeBtnHandler}>
              {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
              {''} Finalize Auction and Create Task
            </CButton>
          </CTooltip>
        ) : null}
      </Card>
      {visibleTask ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Task created with ID: {taskID}</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default GetBids

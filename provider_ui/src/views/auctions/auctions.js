import React from 'react'
import {
  CButton,
  CTable,
  CFormCheck,
  CForm,
  CFormLabel,
  CFormInput,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CWidgetStatsE,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { CChartPie } from '@coreui/react-chartjs'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import AuctionsManagerSepolia from '../../constants/AuctionsManagerSepolia.json'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'
import calculateScore from '../../utils/Score'
import compareAddresses from 'src/utils/compareAddresses'

function GetAuctions() {
  const [auctionContract, setAuctionContract] = useState(null)
  const [taskContract, setTaskContract] = useState(null)

  const [bid, setBid] = useState(5)
  const [auctions, setAuctions] = useState(null)
  const [auctionID, setAuctionID] = useState(null)
  const [selectedRadio, setSelectedRadio] = useState(null)
  const [score, setScore] = useState(null)
  const [upVotes, setUpvotes] = useState(null)
  const [downVotes, setDownvotes] = useState(null)
  const [bidSelected, setBidSelected] = useState(false)
  const [auctionsSelected, setAuctionsSelected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

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

  useEffect(() => {
    const getScore = async () => {
      if (taskContract && window.ethereum.selectedAddress) {
        const performance = await taskContract.getPerformance(window.ethereum.selectedAddress)
        const score = (
          calculateScore(performance.upVotes.toNumber(), performance.downVotes.toNumber()) * 100
        ).toFixed(2)

        setUpvotes(performance.upVotes.toNumber())
        setDownvotes(performance.downVotes.toNumber())
        setScore(score)
      }
    }

    getScore()
  }, [taskContract])

  const getAuctionsBtnHandler = async () => {
    setAuctionsSelected(!auctionsSelected)
    const auctions = await auctionContract.getActiveAuctions()
    setAuctions(auctions)
  }

  useEffect(() => {
    if (auctionContract) {
      const bidPlacedHandler = (auctionID, provider, bid) => {
        if (compareAddresses(provider, window.ethereum.selectedAddress)) {
          setLoading(false)
          setVisible(true)

          setTimeout(() => {
            setVisible(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

      auctionContract.on('BidPlaced', bidPlacedHandler)

      return () => {
        auctionContract.off('BidPlaced', bidPlacedHandler)
      }
    }
  }, [auctionContract])

  const auctionRadioHandler = (auctionID, index) => {
    setAuctionID(auctionID)
    setSelectedRadio(auctionID)
  }

  const handleBidChange = (event) => {
    setBid(event.target.value)
  }

  const bidHandler = () => {
    setBidSelected(!bidSelected)
  }

  const makeBidHandler = async () => {
    setLoading(true)
    await auctionContract.bid(auctionID, bid)
  }

  const auctionsColumns = [
    {
      key: 'button',
      label: '',
      _props: { scope: 'col' },
    },
    {
      key: 'auctionId',
      label: 'AuctionID',
      _props: { scope: 'col' },
    },
    {
      key: 'timeCreated',
      label: 'Creation',
      _props: { scope: 'col' },
    },
    {
      key: 'auctionDeadline',
      label: 'Deadline',
      _props: { scope: 'col' },
    },
    {
      key: 'taskDeadline',
      label: 'TaskDeadline(sec)',
      _props: { scope: 'col' },
    },
  ]

  const mapAuctions = (auctions) => {
    if (auctions) {
      const mappedAuctions = auctions.map((auction) => {
        return {
          button: (
            <CFormCheck
              type="radio"
              name="exampleRadios"
              id="exampleRadios1"
              value="option1"
              onChange={() => auctionRadioHandler(auction.auctionID)}
              checked={selectedRadio === auction.auctionID}
            />
          ),
          auctionId: auction.auctionID.slice(0, 6) + '...' + auction.auctionID.slice(-4),
          timeCreated: new Date(auction.creationTime.toNumber() * 1000).toLocaleString('en-GB'),
          auctionDeadline: new Date(
            (auction.creationTime.toNumber() + auction.auctionDeadline.toNumber()) * 1000,
          ).toLocaleString('en-GB'),
          taskDeadline: auction.taskDeadline.toNumber(),
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
      <CRow>
        <CCol xs={15}>
          <CWidgetStatsE
            className="mb-3 widget"
            chart={
              <CChartPie
                className="mx-auto"
                style={{ height: '100%' }}
                data={{
                  labels: ['Successful Tasks', 'Unsuccessful Tasks'],
                  datasets: [
                    {
                      backgroundColor: ['#2eb85c', '#e55353'],
                      borderColor: 'transparent',
                      borderWidth: 1,
                      data: [`${upVotes}`, `${downVotes}`],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      display: false,
                    },
                    y: {
                      display: false,
                    },
                  },
                }}
              />
            }
            title="My Performance"
            value={`${score}%`}
          />
        </CCol>
      </CRow>
      {/* Calling all values which we 
   have stored in usestate */}
      <Card className="text-center">
        <CButton color="primary" onClick={getAuctionsBtnHandler}>
          Get Auctions
        </CButton>
      </Card>
      <Card className="text-center">
        {auctionsSelected && auctions ? (
          <CTable columns={auctionsColumns} items={mapAuctions(auctions)} />
        ) : null}
      </Card>

      {auctionID ? (
        <Card className="text-center">
          <CButton color="info" onClick={bidHandler}>
            Bid
          </CButton>

          {bidSelected ? (
            <Card className="text-center">
              <CForm>
                <div className="mb-3">
                  <CFormLabel htmlFor="auctionDeadline"></CFormLabel>
                  <CFormInput
                    type="number"
                    id="bid"
                    text="Wei per second of execution"
                    value={bid}
                    onChange={handleBidChange}
                    step={10}
                    min={5}
                  />
                </div>
              </CForm>
              <CButton color="success" onClick={makeBidHandler}>
                {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
                {''} Make Bid
              </CButton>
            </Card>
          ) : null}
        </Card>
      ) : null}
      {visible ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Bid placed successfully</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default GetAuctions

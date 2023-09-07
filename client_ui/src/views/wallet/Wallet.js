import React from 'react'
import { CButton } from '@coreui/react'
import { useState } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'

function Wallet() {
  // useState for storing and retrieving wallet details
  const [data, setdata] = useState({
    address: '',
    Balance: null,
  })

  // Button handler button for handling a
  // request event for metamask
  const btnhandler = () => {
    // Asking if metamask is already present or not
    if (window.ethereum) {
      // res[0] for fetching a first wallet
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((res) => accountChangeHandler(res[0]))
    } else {
      alert('install metamask extension!!')
    }
  }

  // getbalance function for getting a balance in
  // a right format with help of ethers
  const getbalance = (address) => {
    // Requesting balance method
    window.ethereum
      .request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })
      .then((balance) => {
        // Setting balance
        setdata({
          Balance: ethers.utils.formatEther(balance),
          address: address,
        })
      })
  }

  // Function for getting handling all events
  const accountChangeHandler = (account) => {
    // Setting an address data
    setdata({
      address: account,
    })

    // Setting a balance
    getbalance(account)
  }

  return (
    <div className="App">
      {/* Calling all values which we 
       have stored in usestate */}
      <Card className="text-center">
        <Card.Header>
          <strong>Address: </strong>
          {data.address}
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <strong>Balance: </strong>
            {data.Balance}
          </Card.Text>
          <CButton color="primary" onClick={btnhandler}>
            Connect to Wallet
          </CButton>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Wallet

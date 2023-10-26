import React from 'react'
import {
  CButton,
  CFormCheck,
  CTable,
  CSpinner,
  CAlert,
  CRow,
  CCol,
  CWidgetStatsE,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { CChartPie } from '@coreui/react-chartjs'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import TasksManagerMumbai from '../../constants/TasksManagerMumbai.json'
import { Web3Provider } from '@ethersproject/providers'
import compareAddresses from 'src/utils/compareAddresses'
import calculatePayment from 'src/utils/calculatePayment'
import calculateScore from 'src/utils/score'

function Tasks() {
  const [taskContract, setTaskContract] = useState(null)
  const [taskID, setTaskID] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [selectedTaskRadio, setSelectedTaskRadio] = useState(null)
  const [taskState, setTaskState] = useState(null)
  const [paymentState, setPaymentState] = useState(null)
  const [payment, setPayment] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visiblePending, setVisiblePending] = useState(false)
  const [visibleCompleted, setVisibleCompleted] = useState(false)
  const [visibleTasks, setVisibleTasks] = useState(false)
  const [score, setScore] = useState(null)
  const [upVotes, setUpvotes] = useState(null)
  const [downVotes, setDownvotes] = useState(null)

  useEffect(() => {
    const contractData = async () => {
      const provider = new Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const taskContract = new ethers.Contract(
        TasksManagerSepolia.address,
        TasksManagerSepolia.abi,
        // TasksManagerMumbai.address,
        // TasksManagerMumbai.abi,
        signer,
      )
      setTaskContract(taskContract)
    }

    contractData()
  }, [])

  const getTasksBtnhandler = async () => {
    setVisibleTasks(!visibleTasks)
    const tasks = await taskContract.getTasksByClient()
    setTasks(tasks)
  }

  const taskRadioHandler = (taskID, taskState, paymentState) => {
    setTaskID(taskID)
    setSelectedTaskRadio(taskID)
    // setTaskState(tasks.find((task) => task.taskID === taskID).taskState)
    // setPaymentState(tasks.find((task) => task.taskID === taskID).paymentState)
    setTaskState(taskState)
    setPaymentState(paymentState)
  }

  useEffect(() => {
    if (taskContract) {
      const paymentPendingHandler = (taskID, client, provider, payment) => {
        if (compareAddresses(client, window.ethereum.selectedAddress)) {
          setPayment(payment.toNumber())
          setTaskID(taskID)
          setLoading(false)
          setVisiblePending(true)

          setTimeout(() => {
            setVisiblePending(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

      const paymentCompletedHandler = (taskID, client, provider) => {
        if (compareAddresses(client, window.ethereum.selectedAddress)) {
          setVisibleCompleted(true)
          setLoading(false)
          setPaymentState(2)

          setTimeout(() => {
            setVisibleCompleted(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

      const getScore = async () => {
        if (taskContract && window.ethereum.selectedAddress) {
          const performance = await taskContract.getClientPerformance(
            window.ethereum.selectedAddress,
          )
          const score = (
            calculateScore(performance.upVotes.toNumber(), performance.downVotes.toNumber()) * 100
          ).toFixed(2)

          setUpvotes(performance.upVotes.toNumber())
          setDownvotes(performance.downVotes.toNumber())
          setScore(score)
        }
      }

      getScore()

      taskContract.on('PaymentPending', paymentPendingHandler)
      taskContract.on('PaymentCompleted', paymentCompletedHandler)

      return () => {
        taskContract.off('PaymentPending', paymentPendingHandler)
        taskContract.off('PaymentCompleted', paymentCompletedHandler)
      }
    }
  }, [taskContract])

  const GWEI = 1000000000

  const payHandler = async () => {
    setLoading(true)
    const task = tasks.find((task) => task.taskID === taskID)
    const payment = calculatePayment(task.price.toNumber(), task.duration.toNumber()).pending
    setPayment(payment)
    const wei = 1000000000000000000
    if (payment) {
      const valueEth = ethers.utils.parseEther((payment / wei).toFixed(18).toString())
      await taskContract.completePayment(taskID, { value: valueEth })
    }
  }

  const resultsHandler = async () => {
    const results = await taskContract.getResults(taskID)
    setResults(results)
  }

  const TaskState = {
    0: 'Created',
    1: 'Cancelled',
    2: 'Active',
    3: 'CompletedSuccessfully',
    4: 'CompletedUnsuccessfully',
    5: 'Invalid',
    6: 'ResultsReceivedSuccessfully',
    7: 'ResultsReceivedUnsuccessfully',
  }

  const tasksColumns = [
    {
      key: 'button',
      label: '',
      _props: { scope: 'col' },
    },
    {
      key: 'taskID',
      label: 'TaskID',
      _props: { scope: 'col' },
    },
    {
      key: 'price',
      label: 'Price[Gwei]',
      _props: { scope: 'col' },
    },
    {
      key: 'activationTime',
      label: 'Activation',
      _props: { scope: 'col' },
    },
    {
      key: 'deadline',
      label: 'Deadline',
      _props: { scope: 'col' },
    },
    {
      key: 'taskState',
      label: 'TaskState',
      _props: { scope: 'col' },
    },
    {
      key: 'paymentState',
      label: 'PaymentState[Gwei]',
      _props: { scope: 'col' },
    },
  ]

  const paymentStateFunction = (task) => {
    if (task.paymentState === 0) {
      return 'Initialized'
    } else if (task.paymentState === 1) {
      return `Pending[${
        calculatePayment(task.price.toNumber(), task.duration.toNumber()).pending / GWEI
      }]`
    } else if (task.paymentState === 2) {
      return `Completed[${
        calculatePayment(task.price.toNumber(), task.duration.toNumber()).completed / GWEI
      }]`
    }
  }

  const mapTasks = (tasks) => {
    if (tasks) {
      const mappedTasks = tasks.map((task) => {
        return task.taskState === 6 || task.paymentState === 1
          ? {
              button: (
                <CFormCheck
                  type="radio"
                  name="auctionRadio"
                  id="auctionRadio"
                  value="option1"
                  onChange={() => taskRadioHandler(task.taskID, task.taskState, task.paymentState)}
                  checked={selectedTaskRadio === task.taskID}
                />
              ),
              taskID: task.taskID.slice(0, 6) + '...' + task.taskID.slice(-4),
              deadline:
                task.activationTime.toNumber() !== 0
                  ? new Date(
                      (task.activationTime.toNumber() + task.deadline.toNumber()) * 1000,
                    ).toLocaleString('en-GB')
                  : '-',
              price: task.price.toNumber() / GWEI,
              activationTime:
                task.activationTime.toNumber() !== 0
                  ? new Date(task.activationTime.toNumber() * 1000).toLocaleString('en-GB')
                  : '-',
              taskState: TaskState[task.taskState],
              paymentState: paymentStateFunction(task),
              activationEpoch: task.activationTime.toNumber(),
            }
          : {
              button: (
                <CFormCheck
                  type="radio"
                  name="auctionRadio"
                  id="auctionRadio"
                  value="option1"
                  onChange={() => taskRadioHandler(task.taskID)}
                  disabled
                />
              ),
              taskID: task.taskID.slice(0, 6) + '...' + task.taskID.slice(-4),
              deadline:
                task.activationTime.toNumber() !== 0
                  ? new Date(
                      (task.activationTime.toNumber() + task.deadline.toNumber()) * 1000,
                    ).toLocaleString('en-GB')
                  : '-',
              price: task.price.toNumber() / GWEI,
              activationTime:
                task.activationTime.toNumber() !== 0
                  ? new Date(task.activationTime.toNumber() * 1000).toLocaleString('en-GB')
                  : '-',
              taskState: TaskState[task.taskState],
              paymentState: paymentStateFunction(task),
              activationEpoch: task.activationTime.toNumber(),
            }
      })

      //sort tasks by activationDate in descending order
      const sortedTasks = mappedTasks.sort((a, b) => {
        if (a.activationEpoch === 0 && b.activationEpoch === 0) {
          return 0
        } else if (a.activationEpoch === 0) {
          return -1
        } else if (b.activationEpoch === 0) {
          return 1
        } else {
          return b.activationEpoch - a.activationEpoch
        }
      })
      return sortedTasks
    }
  }

  return (
    <div className="App">
      {/* Calling all values which we 
   have stored in usestate */}
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
      <Card className="text-center">
        <CButton color="primary" onClick={getTasksBtnhandler}>
          My Tasks
        </CButton>
      </Card>
      {taskID && taskState === 6 && paymentState === 1 ? (
        <Card className="text-center">
          <CButton color="info" onClick={payHandler}>
            {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
            {''} Complete Payment
          </CButton>
        </Card>
      ) : null}
      {taskID && taskState === 6 && paymentState === 2 ? (
        <Card className="text-center">
          <CButton color="info" onClick={resultsHandler}>
            Receive Results
          </CButton>
          {results}
        </Card>
      ) : null}
      <Card className="text-center">
        {visibleTasks && tasks ? <CTable columns={tasksColumns} items={mapTasks(tasks)} /> : null}
      </Card>
      {visiblePending && payment ? (
        <CAlert color="warning" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>
            Task ID: {taskID} payment pending: {payment}
          </div>
        </CAlert>
      ) : null}
      {visibleCompleted ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Task ID: {taskID} payment completed!</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default Tasks

import React from 'react'
import { CButton, CTable, CAlert, CRow, CCol, CWidgetStatsE } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { CChartPie } from '@coreui/react-chartjs'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'
import compareAddresses from 'src/utils/compareAddresses'
import calculateScore from '../../utils/Score'
import calculatePayment from 'src/utils/calculatePayment'

function TasksHistory() {
  const [taskContract, setTaskContract] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [visiblePayment, setVisiblePayment] = useState(false)
  const [payment, setPayment] = useState(null)
  const [score, setScore] = useState(null)
  const [upVotes, setUpvotes] = useState(null)
  const [downVotes, setDownvotes] = useState(null)
  const [tasksSelected, setTasksSelected] = useState(false)

  useEffect(() => {
    const contractData = async () => {
      const provider = new Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const taskContract = new ethers.Contract(
        TasksManagerSepolia.address,
        TasksManagerSepolia.abi,
        signer,
      )
      setTaskContract(taskContract)
    }

    contractData()
  }, [])

  useEffect(() => {
    if (taskContract) {
      const paymentReceivedHandler = (_provider, amount) => {
        if (compareAddresses(_provider, window.ethereum.selectedAddress)) {
          setVisiblePayment(true)
          setPayment(amount.toNumber())

          setTimeout(() => {
            setVisiblePayment(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

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

      taskContract.on('TransferMadeToProvider', paymentReceivedHandler)

      return () => {
        taskContract.off('TransferMadeToProvider', paymentReceivedHandler)
      }
    }
  }, [taskContract])

  const getTasksBtnhandler = async () => {
    setTasksSelected(!tasksSelected)
    const tasks = await taskContract.getTasksByProvider()
    setTasks(tasks)
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
      key: 'taskID',
      label: 'TaskID',
      _props: { scope: 'col' },
    },
    {
      key: 'price',
      label: 'Price',
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
      label: 'PaymentState[wei]',
      _props: { scope: 'col' },
    },
  ]

  const mapTasks = (tasks) => {
    if (tasks) {
      const mappedTasks = tasks.map((task) => {
        return task.taskState !== 0 ||
          task.activationTime.toNumber() + task.deadline.toNumber() > Math.floor(Date.now() / 1000)
          ? {
              taskID: task.taskID.slice(0, 6) + '...' + task.taskID.slice(-4),
              deadline:
                task.activationTime.toNumber() !== 0
                  ? new Date(
                      (task.activationTime.toNumber() + task.deadline.toNumber()) * 1000,
                    ).toLocaleString('en-GB')
                  : '-',
              price: task.price.toNumber(),
              activationTime:
                task.activationTime.toNumber() !== 0
                  ? new Date(task.activationTime.toNumber() * 1000).toLocaleString('en-GB')
                  : '-',
              taskState: TaskState[task.taskState],
              paymentState: (() => {
                if (task.paymentState === 0) {
                  return 'Initialized'
                } else if (task.paymentState === 1) {
                  return `Pending[${
                    calculatePayment(task.price.toNumber(), task.duration.toNumber()).pending
                  }]`
                } else if (task.paymentState === 2) {
                  return `Completed[${
                    calculatePayment(task.price.toNumber(), task.duration.toNumber()).completed
                  }]`
                }
              })(),
              activationEpoch: task.activationTime.toNumber(),
            }
          : {}
      })
      //sort tasks by activation time in descending order
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
          Tasks History
        </CButton>
      </Card>
      <Card className="text-center">
        {tasksSelected && tasks ? <CTable columns={tasksColumns} items={mapTasks(tasks)} /> : null}
      </Card>
      {visiblePayment ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Payment received: {payment}</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default TasksHistory

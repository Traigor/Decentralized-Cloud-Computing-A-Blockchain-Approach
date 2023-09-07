import React from 'react'
import { CButton, CFormCheck, CTable, CSpinner, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import { Web3Provider } from '@ethersproject/providers'
import compareAddresses from 'src/utils/compareAddresses'

function GetBids() {
  const [taskContract, setTaskContract] = useState(null)
  const [taskID, setTaskID] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [selectedTaskRadio, setSelectedTaskRadio] = useState(null)
  const [taskState, setTaskState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visibleActivate, setVisibleActivate] = useState(false)
  const [visiblePayment, setVisiblePayment] = useState(false)
  const [payment, setPayment] = useState(null)

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

      const taskActivatedHandler = (taskID, client, provider) => {
        if (compareAddresses(provider, window.ethereum.selectedAddress)) {
          setLoading(false)
          setVisibleActivate(true)

          setTimeout(() => {
            setVisibleActivate(false) // Hide the CAlert component after a delay of 60 seconds.
          }, 60000)
        }
      }

      taskContract.on('TaskActivated', taskActivatedHandler)
      taskContract.on('TransferMadeToProvider', paymentReceivedHandler)

      return () => {
        taskContract.off('TransferMadeToProvider', paymentReceivedHandler)
        taskContract.off('TaskActivated', taskActivatedHandler)
      }
    }
  }, [taskContract])

  const getTasksBtnhandler = async () => {
    if (window.ethereum.selectedAddress) {
      const tasks = await taskContract.getTasksByProvider(window.ethereum.selectedAddress)
      setTasks(tasks)
      console.log('tasks', tasks)
    }
  }

  const taskRadioHandler = (taskID, taskState, paymentState) => {
    setTaskID(taskID)
    setSelectedTaskRadio(taskID)
    // setTaskState(tasks.find((task) => task.taskID === taskID).taskState)
    // setPaymentState(tasks.find((task) => task.taskID === taskID).paymentState)
    setTaskState(taskState)
  }

  const activateHandler = async () => {
    setLoading(true)
    console.log('TASKID', taskID)
    const collateral = (await taskContract.getProviderCollateral(taskID)).toNumber()
    console.log('COLLATERAL', collateral)
    const wei = 1000000000000000000
    const valueEth = ethers.utils.parseEther((collateral / wei).toFixed(18).toString())
    await taskContract.activateTask(taskID, { value: valueEth })
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
      label: 'Price',
      _props: { scope: 'col' },
    },
    {
      key: 'timeActivated',
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
        return task.taskState === 0
          ? {
              button: (
                <CFormCheck
                  type="radio"
                  name="taskRadio"
                  id="taskRadio"
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
              price: task.price.toNumber(),
              timeActivated:
                task.activationTime.toNumber() !== 0
                  ? new Date(task.activationTime.toNumber() * 1000).toLocaleString('en-GB')
                  : '-',
              taskState: TaskState[task.taskState],
              paymentState: () => {
                if (task.paymentState === 0) {
                  return 'Initialized'
                } else if (task.paymentState === 1) {
                  return `Pending[${task.cost.toNumber() - task.clientCollateral.toNumber()}]`
                } else if (task.paymentState === 2) {
                  return `Completed[${task.cost}]`
                }
              },
            }
          : {
              button: (
                <CFormCheck
                  type="radio"
                  name="taskRadio"
                  id="taskRadio"
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
              price: task.price.toNumber(),
              timeActivated:
                task.activationTime.toNumber() !== 0
                  ? new Date(task.activationTime.toNumber() * 1000).toLocaleString('en-GB')
                  : '-',
              taskState: TaskState[task.taskState],
              paymentState: (() => {
                if (task.paymentState === 0) {
                  return 'Initialized'
                } else if (task.paymentState === 1) {
                  return `Pending[${task.cost.toNumber() - task.clientCollateral.toNumber()}]`
                } else if (task.paymentState === 2) {
                  return `Completed[${task.cost}]`
                }
              })(),
            }
      })
      //sort tasks by activationDate in descending order
      const sortedTasks = mappedTasks.sort((a, b) => {
        if (a.timeActivated === '-' && b.timeActivated === '-') {
          return 0
        } else if (a.timeActivated === '-') {
          return -1
        } else if (b.timeActivated === '-') {
          return 1
        } else {
          return new Date(b.timeActivated) - new Date(a.timeActivated)
        }
      })
      return sortedTasks
    }
  }

  return (
    <div className="App">
      {/* Calling all values which we 
   have stored in usestate */}
      <Card className="text-center">
        <CButton color="primary" onClick={getTasksBtnhandler}>
          My Tasks
        </CButton>
      </Card>
      <Card className="text-center">
        {tasks ? <CTable columns={tasksColumns} items={mapTasks(tasks)} /> : null}
      </Card>
      {taskID && taskState === 0 ? (
        <Card className="text-center">
          <CButton color="primary" onClick={activateHandler}>
            {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
            {''} Activate
          </CButton>
        </Card>
      ) : null}
      {visibleActivate ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Task activated successfully: {taskID} </div>
        </CAlert>
      ) : null}
      {visiblePayment ? (
        <CAlert color="success" className="d-flex align-items-center" dismissible>
          <CIcon icon={cilCheckCircle} className="flex-shrink-0 me-2" width={24} height={24} />
          <div>Payment received: {payment}</div>
        </CAlert>
      ) : null}
    </div>
  )
}

export default GetBids

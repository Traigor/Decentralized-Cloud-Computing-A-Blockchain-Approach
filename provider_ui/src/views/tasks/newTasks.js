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

      return () => {
        taskContract.off('TaskActivated', taskActivatedHandler)
      }
    }
  }, [taskContract])

  const getTasksBtnhandler = async () => {
    setTasksSelected(!tasksSelected)
    if (window.ethereum.selectedAddress) {
      const tasks = await taskContract.getTasksByProvider(window.ethereum.selectedAddress)
      setTasks(tasks)
      console.log('tasks', tasks)
    }
  }

  const taskRadioHandler = (taskID, taskState, paymentState) => {
    setTaskID(taskID)
    setSelectedTaskRadio(taskID)

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
            }
          : {}
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
      <Card className="text-center">
        <CButton color="primary" onClick={getTasksBtnhandler}>
          My New Tasks
        </CButton>
      </Card>
      <Card className="text-center">
        {tasksSelected && tasks ? <CTable columns={tasksColumns} items={mapTasks(tasks)} /> : null}
      </Card>
      {taskID && taskState === 0 ? (
        <Card className="text-center">
          <CButton color="success" onClick={activateHandler}>
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
    </div>
  )
}

export default GetBids

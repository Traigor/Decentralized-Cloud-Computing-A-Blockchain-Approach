import React from 'react'
import { CButton, CFormCheck, CTable, CSpinner, CAlert, CTooltip } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle } from '@coreui/icons'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card } from 'react-bootstrap'
import TasksManagerSepolia from '../../constants/TasksManagerSepolia.json'
import TasksManagerMumbai from '../../constants/TasksManagerMumbai.json'
import { Web3Provider } from '@ethersproject/providers'
import compareAddresses from 'src/utils/compareAddresses'

function ActivateTask() {
  const [taskContract, setTaskContract] = useState(null)
  const [taskID, setTaskID] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [selectedTaskRadio, setSelectedTaskRadio] = useState(null)
  const [taskState, setTaskState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visibleActivate, setVisibleActivate] = useState(false)
  const [tasksSelected, setTasksSelected] = useState(false)
  const [providerCollateral, setProviderCollateral] = useState(null)

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
    const tasks = await taskContract.getTasksByProvider()
    setTasks(tasks)
  }

  const taskRadioHandler = async (taskID, taskState, paymentState) => {
    setTaskID(taskID)
    setSelectedTaskRadio(taskID)
    const collateral = (await taskContract.getProviderCollateral(taskID)).toNumber()
    setProviderCollateral(collateral)
    setTaskState(taskState)
  }

  const activateHandler = async () => {
    setLoading(true)
    const wei = 1000000000000000000
    const valueEth = ethers.utils.parseEther((providerCollateral / wei).toFixed(18).toString())
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
      key: 'deadline',
      label: 'Deadline(sec)',
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
              deadline: task.deadline.toNumber(),
              price: task.price.toNumber(),
              taskState: TaskState[task.taskState],
            }
          : {}
      })
      //sort tasks by deadline in ascending order
      const sortedTasks = mappedTasks.sort((a, b) => {
        if (a.deadline === 0 && b.deadline === 0) {
          return 0
        } else if (a.deadline === 0) {
          return 1
        } else if (b.deadline === 0) {
          return -1
        } else {
          return a.deadline - b.deadline
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
          <CTooltip
            content={`You will be charged ${providerCollateral} wei as collateral`}
            placement="bottom"
          >
            <CButton color="success" onClick={activateHandler}>
              {loading ? <CSpinner size="sm" aria-hidden="true" /> : null}
              {''} Activate
            </CButton>
          </CTooltip>
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

export default ActivateTask

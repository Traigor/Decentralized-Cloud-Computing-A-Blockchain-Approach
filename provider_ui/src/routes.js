import React from 'react'

const Wallet = React.lazy(() => import('./views/wallet/Wallet'))
const ActiveAuctions = React.lazy(() => import('./views/auctions/auctions'))
const NewTasks = React.lazy(() => import('./views/tasks/newTasks'))
const TasksHistory = React.lazy(() => import('./views/tasks/history'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/auctions', name: 'Auctions', element: ActiveAuctions },
  { path: '/tasks/newTasks', name: 'NewTasks', element: NewTasks },
  { path: '/tasks/history', name: 'TasksHistory', element: TasksHistory },
  { path: '/wallet', name: 'Wallet', element: Wallet },
]

export default routes

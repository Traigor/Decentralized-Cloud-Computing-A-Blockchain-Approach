import React from 'react'

const Wallet = React.lazy(() => import('./views/wallet/Wallet'))
const ActiveAuctions = React.lazy(() => import('./views/auctions/auctions'))
const AuctionsHistory = React.lazy(() => import('./views/auctions/history'))
const AuctionBids = React.lazy(() => import('./views/auctions/bids'))
const NewTasks = React.lazy(() => import('./views/tasks/newTasks'))
const TasksHistory = React.lazy(() => import('./views/tasks/history'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/auctions/activeAuctions', name: 'ActiveAuctions', element: ActiveAuctions },
  { path: '/auctions/history', name: 'AuctionsHistory', element: AuctionsHistory },
  { path: '/auctions/bids', name: 'AuctionBids', element: AuctionBids },
  { path: '/tasks/newTasks', name: 'NewTasks', element: NewTasks },
  { path: '/tasks/history', name: 'TasksHistory', element: TasksHistory },
  { path: '/wallet', name: 'Wallet', element: Wallet },
]

export default routes

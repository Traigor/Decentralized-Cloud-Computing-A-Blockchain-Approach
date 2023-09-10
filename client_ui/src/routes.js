import React from 'react'

const Wallet = React.lazy(() => import('./views/wallet/Wallet'))
const NewAuction = React.lazy(() => import('./views/auctions/newAuction'))
const ActiveAuctions = React.lazy(() => import('./views/auctions/activeAuctions'))
const History = React.lazy(() => import('./views/auctions/history'))
const Tasks = React.lazy(() => import('./views/tasks/Tasks'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/auctions/newAuction', name: 'NewAuction', element: NewAuction },
  { path: '/auctions/activeAuctions', name: 'ActiveAuctions', element: ActiveAuctions },
  { path: '/auctions/history', name: 'History', element: History },
  { path: '/tasks', name: 'Tasks', element: Tasks },
  { path: '/wallet', name: 'Wallet', element: Wallet },
]

export default routes

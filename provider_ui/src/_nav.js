import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilCode, cilWallet, cilSettings } from '@coreui/icons'
import { CNavItem, CNavGroup } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Auctions',
    to: '/auctions',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Tasks',
    to: '/tasks',
    icon: <CIcon icon={cilCode} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'New Tasks',
        to: '/tasks/newTasks',
      },
      {
        component: CNavItem,
        name: 'History',
        to: '/tasks/history',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Wallet',
    to: '/wallet',
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Settings',
    to: '/wallet',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav

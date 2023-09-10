import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilCode, cilWallet, cilSettings } from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavGroup,
    name: 'Auctions',
    to: '/auctions',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'New Auction',
        to: '/auctions/newAuction',
      },
      {
        component: CNavItem,
        name: 'Active Auctions',
        to: '/auctions/activeAuctions',
      },
      {
        component: CNavItem,
        name: 'History',
        to: '/auctions/history',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Tasks',
    to: '/tasks',
    icon: <CIcon icon={cilCode} customClassName="nav-icon" />,
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

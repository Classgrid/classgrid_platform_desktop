import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Revenue', path: '/super-admin/billing/revenue' },
  { name: 'Transactions', path: '/super-admin/billing/transactions' },
  { name: 'Failed Payments', path: '/super-admin/billing/failed-payments' },
  { name: 'Plans & Billing', path: '/super-admin/billing/plans' },
];

export const BillingNavigation = () => {
  return (
    <nav className="flex border-b border-border overflow-x-auto hide-scrollbar" aria-label="Billing Navigation">
      <ul className="flex min-w-full space-x-8">
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`
              }
            >
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
